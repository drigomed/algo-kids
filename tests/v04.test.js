import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {initialState,applyCommand,simulate,createExecution,stepExecution,validateMission,validateProgram,terminal,evaluateCondition} from '../src/engine.js';
import {validateCondition} from '../src/rules.js';
import {assertJsonData} from '../src/data.js';
import {configureCommand,validateCommand} from '../src/commands.js';
import {configureCondition} from '../src/condition-options.js';
import {editProgram,sequenceAt} from '../src/program.js';
import {renderProgram,renderBoard} from '../src/view.js';
import {renderMemory,renderCommandPalette,renderDecisionTrace,failureMessage,commandMessages} from '../src/command-view.js';
import {missions,missionVariants} from '../src/missions.js';
import {createSession,stepSession,canStep,startVariantTests} from '../src/session.js';
const mem=(variable,value)=>({type:'memoryEquals',variable,value});
const eq=(variable,value)=>({type:'stateEquals',variable,value});
const set=(variable,value)=>({type:'set',variable,value});
const interact=(relativeTo='front',actionId='act')=>({type:'interact',relativeTo,actionId});
const inspect=(into='reading',property='mark')=>({type:'inspect',source:{type:'cellProperty',relativeTo:'front',property},into});
const remember=(variable,value)=>({type:'setMemory',variable,value});
const conditional=(condition,then=[],otherwise=[])=>({type:'if',condition,then,else:otherwise});
function base() {return {
 grid:{width:5,height:5,obstacles:[],cells:[{row:4,col:1,properties:{mark:{stateVariable:'text'},amount:2,enabled:false}}]},start:{row:4,col:0,direction:'L'},goal:{row:0,col:4},initialVariables:{flag:false,count:0,text:'red'},
 robotMemory:{reading:{type:'string',initial:null},flag:{type:'boolean',initial:null},number:{type:'number',initial:null},empty:{type:'string',initial:''}},
 commandOptions:[{id:'read',label:'Observar a marca',node:inspect()},{id:'readNumber',label:'Observar a quantidade',node:inspect('number','amount')},{id:'readBoolean',label:'Observar uma resposta',node:inspect('flag','enabled')},{id:'rememberFlag',label:'Guardar resposta',node:remember('flag',true),values:[{value:true,label:'Sim'},{value:false,label:'Não'}]},{id:'rememberNumber',label:'Guardar quantidade',node:remember('number',0),values:[{value:0,label:'Zero'},{value:2,label:'Dois'}]},{id:'rememberText',label:'Guardar informação',node:remember('reading','red'),values:[{value:'red',label:'Vermelha'},{value:'blue',label:'Azul'}]},{id:'useFront',label:'Usar à frente',node:interact()},{id:'useHere',label:'Usar aqui',node:interact('here')},{id:'change',label:'Mudar a marca',node:interact('front','change')}],
 conditionOptions:[{id:'memoryFlag',label:'Guardei Sim?',condition:mem('flag',true)},{id:'memoryNumber',label:'Guardei dois?',condition:mem('number',2)},{id:'memoryText',label:'A informação guardada é vermelha?',condition:mem('reading','red'),values:[{value:'red',label:'Vermelha'},{value:'blue',label:'Azul'}]}],
 entities:[{id:'control',row:4,col:1,collectible:false,onEnter:[],interactions:[{id:'act',relativeTo:['front','here'],once:true,effects:[set('flag',true)]},{id:'change',relativeTo:['front'],effects:[set('text','blue')]}]}],
 presentation:{memory:{reading:{label:'Cor guardada',values:[{value:'red',label:'Vermelha'},{value:'blue',label:'Azul'}]},flag:{label:'Resposta guardada'}}}
};}
function freeze(value){if(value&&typeof value==='object'){Object.values(value).forEach(freeze);Object.freeze(value);}return value;}
function finish(s){let guard=0;while(canStep(s)){assert(++guard<2000);s=stepSession(s);}return s;}
const end=(m,p)=>simulate(m,p).at(-1);
const move={type:'move'};
test('memória desconhecida é distinta de false, zero e string vazia',()=>{
 const m=base();m.robotMemory.flag.initial=false;m.robotMemory.number.initial=0;const s=initialState(m);
 assert.deepEqual(s.memory.reading,{known:false,value:null});assert.deepEqual(s.memory.flag,{known:true,value:false});assert.deepEqual(s.memory.number,{known:true,value:0});assert.deepEqual(s.memory.empty,{known:true,value:''});
 assert.match(renderMemory(m,s),/Texto vazio/);
});
test('inspect copia o valor atual, não movimenta nem muda mundo, e emite origem e valor',()=>{
 const m=freeze(base()),before=freeze(initialState(m)),after=applyCommand(m,before,inspect());
 assert.deepEqual(after.variables,before.variables);assert.equal(after.col,before.col);assert.equal(after.row,before.row);assert.equal(after.direction,before.direction);assert.equal(after.instructionPointer,1);
 assert.deepEqual(after.memory.reading,{known:true,value:'red'});assert.deepEqual(before.memory.reading,{known:false,value:null});
 assert.deepEqual(after.events[0],{type:'inspected',action:'inspect',source:inspect().source,variable:'reading',previous:{known:false,value:null},value:'red',success:true});
});
test('memória permanece snapshot após mudança do mundo e só nova inspeção a atualiza',()=>{
 const m=base();let s=applyCommand(m,initialState(m),inspect());const first=freeze(s);
 s=applyCommand(m,s,interact('front','change'));assert.equal(s.variables.text,'blue');assert.equal(s.memory.reading.value,'red');
 assert.equal(evaluateCondition(m,s,mem('reading','red')),true);
 s=applyCommand(m,s,inspect());assert.equal(s.memory.reading.value,'blue');assert.equal(first.variables.text,'red');assert.equal(first.memory.reading.value,'red');
});
test('inspeção usa orientação e posição atuais, aceita false e números',()=>{
 const m=base();let s=applyCommand(m,initialState(m),inspect('number','amount'));assert.deepEqual(s.memory.number,{known:true,value:2});
 s=applyCommand(m,s,inspect('flag','enabled'));assert.deepEqual(s.memory.flag,{known:true,value:false});
 const turned=applyCommand(m,initialState(m),{type:'turnLeft'});assert.equal(applyCommand(m,turned,inspect()).reason,'propertyMissing');
 const boundary={...initialState(m),col:4};assert.equal(applyCommand(m,boundary,inspect()).reason,'outOfReach');
});
test('falhas de inspeção preservam memória e mundo e não produzem falso sucesso',()=>{
 for(const [reason,change] of [['propertyMissing',m=>m.grid.cells=[]],['typeMismatch',m=>m.grid.cells[0].properties.mark=2],['typeMismatch',m=>m.grid.cells[0].properties.mark='x'.repeat(129)]]){
  const m=base();change(m);const before=freeze(initialState(m)),after=applyCommand(m,before,inspect());
  assert.equal(after.status,'actionFailed');assert.equal(after.reason,reason);assert.deepEqual(after.memory,before.memory);assert.deepEqual(after.variables,before.variables);assert.equal(after.instructionPointer,1);assert.equal(after.events[0].success,false);assert.deepEqual(after.events[0].source,inspect().source);assert.equal(terminal(after),true);
 }
});
test('memoryEquals desconhecida não executa ENTÃO nem SENÃO e informa o motivo',()=>{
 const m=base(),p=[conditional(mem('flag',true),[move],[{type:'turnLeft'}])],states=simulate(m,p),last=states.at(-1);
 assert.equal(last.status,'actionFailed');assert.equal(last.reason,'memoryUnknown');assert.equal(last.instructionPointer,1);assert.equal(last.col,0);assert.equal(last.direction,'L');assert.equal(states.length,2);
 assert.match(failureMessage(m,last),/descubra e guarde/);assert.match(renderDecisionTrace(m,last),/Nenhum ramo executado/);
});
test('igualdade de memória é estrita e não consulta o namespace do mundo',()=>{
 const m=base();let s=applyCommand(m,initialState(m),remember('flag',true));assert.equal(s.variables.flag,false);assert.equal(evaluateCondition(m,s,mem('flag',true)),true);assert.equal(evaluateCondition(m,s,eq('flag',true)),false);
 for(const [variable,value] of [['flag',1],['number','2'],['reading',2]])assert.throws(()=>validateCondition(mem(variable,value),m.initialVariables,0,m.robotMemory));
 assert.equal(evaluateCondition(m,s,mem('flag',1)),false);
});
test('setMemory só aceita variáveis, valores e comandos autorizados no motor e editor',()=>{
 const m=base();assert.deepEqual(configureCommand(m,'rememberFlag',1),remember('flag',false));assert.equal(end(m,[remember('number',0)]).memory.number.value,0);
 for(const node of [remember('number',1),remember('missing',true),remember('flag',1),{...inspect(),into:'number'},{...inspect(),source:{...inspect().source,relativeTo:'here'}},interact('here','change')]){assert.throws(()=>createExecution(m,[node]));assert.throws(()=>editProgram([],{type:'add',path:[],node,mission:m}));}
 assert.throws(()=>createExecution({...m,commandOptions:[]},[inspect()]));assert.throws(()=>createExecution(missions[0],[inspect()]));
});
test('duas opções de atribuição podem autorizar valores distintos da mesma memória',()=>{
 const m=base();m.commandOptions=m.commandOptions.filter(o=>o.id!=='rememberFlag');m.commandOptions.push({id:'yes',label:'Sim',node:remember('flag',true)},{id:'no',label:'Não',node:remember('flag',false)});
 validateMission(m);assert.equal(end(m,[configureCommand(m,'no')]).memory.flag.value,false);
 m.commandOptions.push({id:'duplicate',label:'Outro Sim',node:remember('flag',true)});assert.throws(()=>validateMission(m));
});
test('interact atua em front e here, sem andar e só quando comandado',()=>{
 const m=base(),before=freeze(initialState(m)),front=applyCommand(m,before,interact());assert.equal(front.variables.flag,true);assert.equal(front.col,0);assert(front.events.some(e=>e.type==='interacted'&&e.entityId==='control'&&e.actionId==='act'));
 const walked=applyCommand(m,before,move);assert.equal(walked.variables.flag,false);const here=applyCommand(m,walked,interact('here'));assert.equal(here.variables.flag,true);assert.equal(here.col,1);
 const demo=missions.find(m=>m.id===18);assert.equal(end(demo,[move,move]).status,'collision');
});
test('interação seleciona exatamente um alvo e falha em ausência, alcance, incompatibilidade e ambiguidade',()=>{
 const cases=[['targetMissing',m=>m.entities=[]],['outOfReach',m=>m.entities[0].col=3],['incompatibleTarget',m=>m.entities[0].interactions=m.entities[0].interactions.filter(a=>a.id==='change')],['ambiguousTarget',m=>m.entities.push({...structuredClone(m.entities[0]),id:'other'})]];
 for(const [reason,change] of cases){const m=base();change(m);const before=freeze(initialState(m)),after=applyCommand(m,before,interact());assert.equal(after.reason,reason);assert.equal(after.status,'actionFailed');assert.deepEqual(after.variables,before.variables);assert.deepEqual(after.usedInteractions,[]);assert.equal(after.events.length,1);}
 const m=base();assert.equal(applyCommand(m,{...initialState(m),col:4},interact()).reason,'outOfReach');
});
test('pré-condição falsa ou memória desconhecida não aplica efeitos parciais',()=>{
 for(const [guard,reason] of [[eq('flag',true),'preconditionFailed'],[mem('flag',true),'memoryUnknown']]){
  const m=base();m.entities[0].interactions[0].when=guard;m.entities[0].interactions[0].consume=true;
  const before=freeze(initialState(m)),after=applyCommand(m,before,interact());assert.equal(after.reason,reason);assert.deepEqual(after.variables,before.variables);assert.deepEqual(after.memory,before.memory);assert.deepEqual(after.usedInteractions,[]);assert.deepEqual(after.consumedIds,[]);
 }
});
test('efeitos transacionais revertem escrita anterior quando um efeito posterior falha',()=>{
 for(const effects of [[set('flag',true),{type:'increment',variable:'count',amount:Number.MAX_VALUE},{type:'increment',variable:'count',amount:Number.MAX_VALUE}],[set('flag',true),{when:mem('flag',true),actions:[set('text','blue')]}]]){
  const m=base();m.entities[0].interactions[0].effects=effects;const before=freeze(initialState(m)),after=applyCommand(m,before,interact());assert.equal(after.status,'actionFailed');assert.deepEqual(after.variables,before.variables);assert.deepEqual(after.usedInteractions,[]);assert.equal(after.events.length,1);assert(after.events.every(e=>e.type!=='variableChanged'));
 }
});
test('uma guarda automática de memória desconhecida também falha sem mutação parcial',()=>{
 const m=base();m.entities[0].onEnter=[set('flag',true),{when:mem('flag',true),actions:[set('text','blue')]}];const before=initialState(m),after=applyCommand(m,before,move);
 assert.equal(after.reason,'memoryUnknown');assert.equal(after.col,0);assert.deepEqual(after.variables,before.variables);
});
test('once impede repetição, enquanto interação repetível pode executar novamente',()=>{
 const m=base();let s=applyCommand(m,initialState(m),interact());assert.equal(s.usedInteractions.length,1);const again=applyCommand(m,s,interact());assert.equal(again.reason,'alreadyUsed');assert.deepEqual(again.variables,s.variables);
 s=applyCommand(m,initialState(m),interact('front','change'));s=applyCommand(m,s,interact('front','change'));assert.equal(s.status,'running');assert.deepEqual(s.usedInteractions,[]);
});
test('consumo por interação não vira coleta automática e oculta entidade sem reativar onEnter',()=>{
 const m=base();m.entities[0].interactions[0].once=false;m.entities[0].interactions[0].consume=true;m.entities[0].onEnter=[{type:'increment',variable:'count',amount:1}];
 let s=applyCommand(m,initialState(m),interact());assert.deepEqual(s.consumedIds,['control']);assert.equal(s.collectedCount,0);assert(s.events.some(e=>e.type==='entityConsumed'));
 assert.equal(applyCommand(m,s,interact()).reason,'targetConsumed');s=applyCommand(m,s,move);assert.equal(s.variables.count,0);assert.doesNotMatch(renderBoard(m,s),/class="entity"/);
});
test('interação atualiza barreiras imediatamente e emite eventos determinísticos',()=>{
 const m=missions.find(m=>m.id===18),before=freeze(initialState(m)),after=applyCommand(m,before,m.solution[0]);assert.equal(after.variables.aberta,true);assert(after.events.some(e=>e.type==='barrierChanged'&&e.passable));assert.match(renderBoard(m,after),/barrier open/);assert.deepEqual(after,applyCommand(m,before,m.solution[0]));
});
test('retirada e entrega têm transições distintas e reset restaura memória e entidades',()=>{
 const m=missions.find(m=>m.id===19),states=simulate(m,m.solution),picked=states[2],last=states.at(-1);
 assert.equal(picked.variables.carregando,true);assert.equal(picked.variables.entregue,false);assert.deepEqual(picked.consumedIds,['origem']);assert.equal(picked.memory.confirmar.value,true);assert.equal(picked.variables.confirmar,false);
 assert.equal(last.variables.carregando,false);assert.equal(last.variables.entregue,true);assert.equal(last.status,'won');
 const reset=initialState(m);assert.deepEqual(reset.memory.confirmar,{known:false,value:null});assert.deepEqual(reset.consumedIds,[]);assert.deepEqual(reset.usedInteractions,[]);
 const walkOnly=end(m,[move,move,move]);assert.equal(walkOnly.variables.entregue,false);assert.equal(walkOnly.status,'finished');
});
test('dados inválidos, funções, getters, ciclos, protótipos e limites são rejeitados com diagnóstico',()=>{
 const invalid=[m=>m.robotMemory.flag.initial=1,m=>m.robotMemory.reading.initial='a'.repeat(129),m=>m.robotMemory.constructor={type:'number',initial:0},m=>m.robotMemory=Object.fromEntries(Array.from({length:17},(_,i)=>['m'+i,{type:'number',initial:0}])),m=>m.entities[0].interactions[0].when=null,m=>m.entities[0].interactions[0].relativeTo=['left'],m=>m.commandOptions[0].node.source.type='arbitrary',m=>m.commandOptions[0].node.source.property='constructor',m=>m.variants=[{id:'bad',robotMemory:{x:{type:'number',initial:Infinity}}}],m=>m.presentation.callback=()=>1,m=>m.presentation.self=m];
 for(const change of invalid){const m=base();change(m);assert.throws(()=>validateMission(m));}
 assert.throws(()=>assertJsonData({value:undefined}),/dados.value/);assert.throws(()=>assertJsonData(new Date()));
 let called=false;const getters={};Object.defineProperty(getters,'x',{enumerable:true,get(){called=true;return 1;}});assert.throws(()=>assertJsonData(getters));assert.equal(called,false);
 assert.throws(()=>validateProgram([{type:'move',run:()=>1}],base()));assert.throws(()=>assertJsonData(JSON.parse('{"__proto__":1}')));
});
test('exemplo JSON completo pode ser carregado, validado, serializado e executado',async()=>{
 const m=JSON.parse(await readFile(new URL('../docs/V04-example.json',import.meta.url),'utf8'));assert.equal(validateMission(m),true);assert.deepEqual(m,JSON.parse(JSON.stringify(m)));assert.equal(end(m,m.solution).status,'won');
});
test('novo cenário usa outros IDs, ações e variáveis exclusivamente por configuração',async()=>{
 let json=await readFile(new URL('../docs/V04-example.json',import.meta.url),'utf8');for(const [a,b] of [['origem','terminalX'],['destino','estacaoY'],['receive','press'],['deliver','release'],['carregando','obtained'],['entregue','completed'],['confirmar','intent']])json=json.replaceAll('"'+a+'"','"'+b+'"');
 const m=JSON.parse(json);validateMission(m);const last=end(m,m.solution);assert.equal(last.status,'won');assert.equal(last.variables.completed,true);assert.equal(last.memory.intent.value,true);assert.deepEqual(last.consumedIds,['terminalX']);
});
test('editor insere/configura comandos autorizados nos ramos usando os mesmos validadores',()=>{
 const m=base(),original=freeze([conditional(mem('flag',true))]);let p=editProgram(original,{type:'add',path:[0,'then'],node:configureCommand(m,'rememberFlag'),mission:m});
 p=editProgram(p,{type:'add',path:[0,'then'],node:configureCommand(m,'read'),mission:m});assert.equal(sequenceAt(p,[0,'then']).length,2);assert.equal(original[0].then.length,0);
 p=editProgram(p,{type:'command',path:[0,'then',0],node:configureCommand(m,'rememberFlag',1),mission:m});assert.equal(p[0].then[0].value,false);validateProgram(p,m);
 assert.throws(()=>editProgram(p,{type:'command',path:[0,'then',0],node:remember('flag','false'),mission:m}));assert.deepEqual(configureCondition(m,'memoryFlag',{value:false}),mem('flag',false));
});
test('representação contextual exibe memória, origem, alcance e pergunta/resposta/ramo',()=>{
 const m=base(),before=initialState(m);assert.match(renderMemory(m,before),/Ainda não definido/);assert.equal(renderCommandPalette(missions[0]),'');assert.match(renderCommandPalette(m),/Inspecionar/);assert.match(renderCommandPalette(m),/Guardar valor/);
 const after=applyCommand(m,before,inspect());assert.match(renderMemory(m,after),/memory-field updated/);assert.match(renderMemory(m,after),/Vermelha/);assert.match(commandMessages(m,after).join(' '),/casa à frente/);assert.match(renderBoard(m,after,interact()),/command-reach/);
 const p=[conditional(mem('flag',true))],execution=createExecution(m,p),html=renderProgram(p,m,execution,[0,'then'],false);assert.match(html,/branch-tools/);assert.match(html,/data-inline-option="read"/);assert.match(html,/data-target="0.then"/);assert.doesNotMatch(html,/>memoryEquals</);
 const known=applyCommand(m,before,remember('flag',false)),decision=stepExecution(m,p,{...execution,state:known});const trace=renderDecisionTrace(m,decision.state);assert.match(trace,/PERGUNTA/);assert.match(trace,/RESPOSTA/);assert.match(trace,/SENÃO/);
});
test('sem inspect a demonstração 17 não ganha usando memória desconhecida',()=>{
 const m=missions.find(m=>m.id===17);for(const scenario of missionVariants(m)){const last=end(scenario,m.solution.slice(1));assert.equal(last.status,'actionFailed');assert.equal(last.reason,'memoryUnknown');}
});
for(const m of missions.filter(m=>m.demo))for(const scenario of missionVariants(m))test(`V0.4 ${m.id}/${scenario.variantId}: AST imutável, passo/simulação/sessão equivalentes e orçamento`,()=>{
 const input=freeze(structuredClone(scenario)),program=freeze(structuredClone(m.solution));let execution=freeze(createExecution(input,program));const states=[execution.state];while(!terminal(execution.state)){execution=freeze(stepExecution(input,program,execution));states.push(execution.state);}
 assert.deepEqual(states,simulate(input,program));assert.equal(states.at(-1).status,'won');assert.equal(end(input,program).status,'won');assert.equal(simulate(input,program,{instructionLimit:1}).at(-1).status,'limit');
 assert.equal(finish(createSession(input,program)).execution.state.status,'won');assert.equal(initialState(input).memory.reading?.known??false,false);
});
test('validação entre variantes não reaproveita memória do treino',()=>{
 const m=missions.find(m=>m.id===17);let s=finish(createSession(m,m.solution));assert.equal(s.execution.state.memory.corObservada.value,'vermelho');s=startVariantTests(s);assert.deepEqual(s.execution.state.memory.corObservada,{known:false,value:null});s=finish(s);assert.equal(s.execution.state.memory.corObservada.value,'azul');assert.equal(s.completed,true);
});
test('comandos aninhados consomem um passo por nó e retomam a sequência do pai',()=>{
 const m=base(),p=[remember('flag',true),conditional(mem('flag',true),[inspect(),conditional(mem('reading','red'),[interact()])])];
 const states=simulate(m,p),last=states.at(-1);assert.equal(last.status,'finished');assert.equal(last.instructionPointer,5);assert.equal(last.variables.flag,true);assert.equal(last.memory.reading.value,'red');assert.equal(states.length,6);
 let s=createSession(m,p);s=stepSession(s);const paused=freeze(s);assert.equal(paused.execution.state.instructionPointer,1);s=finish(s);assert.deepEqual(s.execution.state,last);assert.equal(paused.execution.state.instructionPointer,1);
 assert.equal(simulate(m,p,{instructionLimit:4}).at(-1).status,'limit');
});
test('validação JSON rejeita listas com protótipo customizado ou índices não canônicos',()=>{
 class Custom extends Array{};assert.throws(()=>assertJsonData(new Custom(1,2)));
 const list=[1];list.length=2;list['01']=2;assert.throws(()=>assertJsonData(list));
});
test('transição antiga sem campos da V0.4 recebe defaults compatíveis sem mutar o estado',()=>{
 const m=missions[0],old=initialState(m);delete old.memory;delete old.usedInteractions;delete old.consumedIds;freeze(old);
 const next=applyCommand(m,old,move);assert.equal(next.col,old.col+1);assert.deepEqual(next.memory,{});assert.deepEqual(next.consumedIds,[]);assert.equal(Object.hasOwn(old,'memory'),false);
});
