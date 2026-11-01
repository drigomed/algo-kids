import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {initialState,applyCommand,simulate,createExecution,stepExecution,validateMission,validateProgram,terminal,evaluateCondition,classifyResult} from '../src/engine.js';
import {validateCondition,validatePassageCondition,passage,pathClear} from '../src/rules.js';
import {objectProperties} from '../src/properties.js';
import {configureCommand} from '../src/commands.js';
import {configureCondition} from '../src/condition-options.js';
import {editProgram} from '../src/program.js';
import {missions,missionVariants} from '../src/missions.js';
import {createSession,stepSession,startVariantTests,canStep} from '../src/session.js';
import {renderBoard,renderProgram} from '../src/view.js';
import {collisionMessage,passageIndicators,commandDescription,renderMemory,renderCommandPalette,resultLabel} from '../src/command-view.js';
const literal=value=>({kind:'literal',value});
const world=name=>({kind:'worldVariable',name});
const memory=name=>({kind:'memoryVariable',name});
const own=name=>({kind:'barrierProperty',name});
const cmp=(left,operator,right)=>({type:'numberCompare',left,operator,right});
const seq=text=>text.split('').map(c=>({type:{A:'move',D:'turnRight',E:'turnLeft'}[c]}));
const move={type:'move'};
const end=(m,p)=>simulate(m,p).at(-1);
const m20=()=>structuredClone(missionVariants(missions.find(m=>m.id===20))[1]);
const m21=()=>structuredClone(missionVariants(missions.find(m=>m.id===21))[0]);
function freeze(value){if(value&&typeof value==='object'){Object.values(value).forEach(freeze);Object.freeze(value);}return value;}
function finish(s){let guard=0;while(canStep(s)){assert(++guard<2000);s=stepSession(s);}return s;}
const unchanged=(before,after)=>{for(const key of ['row','col','direction','variables','memory','collectedIds','collectedCount','consumedIds','usedInteractions'])assert.deepEqual(after[key],before[key],key);};

test('os seis operadores numéricos tratam limites, negativos e decimais sem coerção',()=>{
 const m=m20(),s=initialState(m);
 for(const [a,b] of [[1,1],[3,3],[2,1],[1,3],[-2,-1],[1.5,1]]){
  const expected={eq:a===b,ne:a!==b,gt:a>b,gte:a>=b,lt:a<b,lte:a<=b};
  for(const operator of Object.keys(expected)){const condition=cmp(literal(a),operator,literal(b));validateCondition(condition,{});assert.equal(evaluateCondition(m,s,condition),expected[operator]);}
 }
});
test('operandos consultam mundo, collectedCount e memória numérica atual',()=>{
 const m=m20();m.robotMemory.n={type:'number',initial:2};const s=initialState(m);s.collectedCount=3;
 for(const condition of [cmp(world('pacotes'),'eq',literal(2)),cmp(world('collectedCount'),'eq',literal(3)),cmp(memory('n'),'gte',world('pacotes'))]){
  validateCondition(condition,m.initialVariables,0,m.robotMemory);assert.equal(evaluateCondition(m,s,condition),true);
 }
 const invalidState={...s,variables:{...s.variables,pacotes:'2'}};assert.throws(()=>evaluateCondition(m,invalidState,cmp(world('pacotes'),'eq',literal(2))),/typeMismatch/);
});
test('validação rejeita operadores, tipos, referências e contexto numérico inválidos',()=>{
 const m=m20();m.initialVariables.flag=true;m.robotMemory.text={type:'string',initial:null};
 const invalid=[cmp(literal(1),'===',literal(1)),cmp(literal('2'),'eq',literal(2)),cmp(literal(NaN),'lt',literal(2)),cmp(literal(Infinity),'gt',literal(2)),cmp(world('missing'),'eq',literal(1)),cmp(world('flag'),'eq',literal(1)),cmp(memory('text'),'eq',literal(1)),cmp(own('capacidade'),'lte',literal(2)),cmp({kind:'worldVariable',name:'constructor'},'eq',literal(1))];
 for(const condition of invalid)assert.throws(()=>validateCondition(condition,m.initialVariables,0,m.robotMemory));
 const barrier=m.barriers[0];
 for(const condition of [cmp(memory('limiteDaPonte'),'lte',own('capacidade')),{type:'pathClear'},{type:'cellPropertyEquals',relativeTo:'front',property:'x',value:1},{type:'all',conditions:[{type:'pathClear'}]},cmp(world('pacotes'),'lte',own('missing'))])assert.throws(()=>validatePassageCondition(condition,m.initialVariables,barrier));
 const bad=m20();bad.barriers[0].properties.capacidade='1';assert.throws(()=>validateMission(bad));
});
test('memória numérica desconhecida encerra o IF sem executar SENÃO',()=>{
 const m=m20(),condition=cmp(memory('limiteDaPonte'),'gte',literal(1));m.conditionOptions=[{id:'memory',label:'Guardei uma capacidade?',condition}];
 const p=[{type:'if',condition,then:seq('A'),else:seq('D')}],last=end(m,p);assert.equal(last.status,'actionFailed');assert.equal(last.reason,'memoryUnknown');assert.equal(last.instructionPointer,1);assert.equal(last.direction,'N');assert.equal(last.row,4);
});
test('perguntas numéricas autorizam operandos e operador completos, sem acesso contextual indevido',()=>{
 const m=m20(),a=configureCondition(m,'carga');assert.equal(a.operator,'gte');
 assert.throws(()=>validateProgram([{type:'if',condition:{...a,operator:'gt'},then:[],else:[]}],m));
 assert.throws(()=>configureCondition(m,'carga',{value:999}));
 const invalid={...m,conditionOptions:[{id:'bad',label:'Capacidade?',condition:cmp(world('pacotes'),'lte',own('capacidade'))}]};assert.throws(()=>validateMission(invalid));
});
for(const [load,route,expected,limit] of [[0,'A','won',1],[1,'A','won',1],[2,'A','collision',1],[4,'A','collision',1],[2,'B','won',3],[3,'B','won',3],[4,'B','collision',3]])test(`restrição física: carga ${load}, rota ${route}, resultado ${expected}`,()=>{
 const m=m20();m.initialVariables.pacotes=load;const p=seq(route==='A'?'AADAA':'DAAEAA');
 assert.equal(validateProgram(p,m),true);assert.equal(createExecution(m,p).state.status,'ready');
 const states=simulate(m,p),last=states.at(-1);assert.equal(last.status,expected);
 if(expected==='collision'){
  unchanged(states.at(-2),last);assert.equal(last.reason,'capacityExceeded');assert.equal(last.barrierId,route==='A'?'ponte-a':'ponte-b');assert.equal(last.events[0].reason,'capacityExceeded');assert.equal(last.events[0].actual,load);assert.equal(last.events[0].limit,limit);assert.equal(last.instructionPointer,states.at(-2).instructionPointer+1);assert.equal(classifyResult(last),'failure');assert(!last.events.some(e=>e.type==='won'));
 }else assert.equal(classifyResult(last),'success');
});
test('movimento proibido permanece válido no motor e editor e não dispara entrada, coleta ou vitória',()=>{
 const m=m20();m.goal={row:3,col:2};m.entities=[{id:'inside',row:3,col:2,collectible:true,onEnter:[{type:'set',variable:'pacotes',value:0}]}];
 const p=editProgram([],{type:'add',path:[],nodeType:'move'});assert.equal(validateProgram(p,m),true);
 const execution=createExecution(m,p);assert.equal(execution.state.status,'ready');
 const last=stepExecution(m,p,execution).state;assert.equal(last.status,'collision');assert.equal(last.variables.pacotes,2);assert.deepEqual(last.collectedIds,[]);assert.equal(last.events.length,1);unchanged(execution.state,last);
});
test('pathClear e move compartilham a física nos mesmos estados e nas duas barreiras',()=>{
 for(const load of [0,1,2,3,4])for(const [barrierId,position,direction] of [['ponte-a',{row:4,col:2},'N'],['ponte-b',{row:4,col:3},'L']]){
  const m=m20();m.initialVariables.pacotes=load;const s={...initialState(m),...position,direction},barrier=m.barriers.find(b=>b.id===barrierId),access=passage(m,s,barrier),next=applyCommand(m,s,move);
  assert.equal(pathClear(m,s),access.passable);assert.equal(next.status==='collision',!access.passable);if(!access.passable)assert.equal(next.events[0].reason,access.failureCode);
 }
});
test('saber a capacidade não altera a resistência nem evita falha física',()=>{
 const m=m20(),inspect=configureCommand(m,'observarPonteA');const seen=applyCommand(m,initialState(m),inspect);assert.equal(seen.memory.limiteDaPonte.value,1);
 const after=applyCommand(m,seen,move);assert.equal(after.status,'collision');unchanged(seen,after);assert.equal(after.events[0].limit,1);
});
test('propriedade vinculada é a fonte única para regra, inspeção e apresentação atualizada',()=>{
 const m=m20();m.initialVariables.maximo=1;m.barriers[0].properties.capacidade={stateVariable:'maximo'};
 m.entities=[{id:'control',row:3,col:2,collectible:false,onEnter:[],interactions:[{id:'increase',relativeTo:['front'],effects:[{type:'set',variable:'maximo',value:3}]}]}];m.commandOptions.push({id:'increase',label:'Ajustar limite',node:{type:'interact',relativeTo:'front',actionId:'increase',entityId:'control'}});
 let s=initialState(m);const inspect=configureCommand(m,'observarPonteA');s=applyCommand(m,s,inspect);assert.equal(pathClear(m,s),false);assert.equal(s.memory.limiteDaPonte.value,1);
 s=applyCommand(m,s,configureCommand(m,'increase'));assert.equal(pathClear(m,s),true);assert.equal(s.memory.limiteDaPonte.value,1);assert.equal(objectProperties(m.barriers[0],s).capacidade,3);assert.match(passageIndicators(m,s),/Ponte A · Capacidade: 3/);assert(s.events.some(e=>e.type==='barrierChanged'&&e.passable));
 s=applyCommand(m,s,inspect);assert.equal(s.memory.limiteDaPonte.value,3);assert.equal(applyCommand(m,s,move).row,3);
});
test('taxonomia distingue falha, término incompleto, progresso e sucesso',()=>{
 for(const [status,classification] of [['won','success'],['collision','failure'],['actionFailed','failure'],['limit','failure'],['finished','incomplete'],['ready','inProgress'],['running','inProgress']])assert.equal(classifyResult({status}),classification);
 assert.equal(end(m20(),[]).status,'finished');assert.equal(classifyResult(end(m20(),[])),'incomplete');assert.equal(resultLabel('failure'),'Programa interrompido');
});
test('inspeção de entidade e barreira é geométrica, autorizada e não desloca',()=>{
 const m=m21(),p=m.solution[0],before=freeze(initialState(m)),after=applyCommand(m,before,p);unchanged({...before,memory:after.memory},after);assert.equal(after.memory.corNecessaria.value,'vermelho');assert.equal(after.events[0].entityId,'fechadura');
 const here={...p,source:{...p.source,relativeTo:'here'}};m.commandOptions.push({id:'here',label:'Observar aqui',node:here});const onCell={...initialState(m),col:1};assert.equal(applyCommand(m,onCell,here).memory.corNecessaria.value,'vermelho');
 assert.throws(()=>validateProgram([{...p,source:{...p.source,entityId:'opcao-azul'}}],m));
 const b=m20(),inspect=configureCommand(b,'observarPonteA');assert.equal(applyCommand(b,initialState(b),inspect).memory.limiteDaPonte.value,1);
});
test('inspeção não seleciona arbitrariamente entre alvos e não escreve em falha',()=>{
 const m=m21(),explicit=m.solution[0],generic={...explicit,source:{...explicit.source}};delete generic.source.entityId;m.commandOptions.push({id:'any',label:'Observar objeto',node:generic});
 const before=initialState(m),failed=applyCommand(m,before,generic);assert.equal(failed.reason,'ambiguousTarget');assert.deepEqual(failed.memory,before.memory);
 for(const [reason,modify] of [['targetMissing',n=>n.entities=[]],['outOfReach',n=>n.entities[0].col=2],['propertyMissing',n=>n.entities[0].properties={}],['typeMismatch',n=>n.entities[0].properties.cor=1]]){
  const n=m21();modify(n);const result=applyCommand(n,initialState(n),n.solution[0]);assert.equal(result.reason,reason);assert.deepEqual(result.memory.corNecessaria,{known:false,value:null});
 }
});
test('propriedade de entidade é snapshot e atualiza apenas com nova inspeção',()=>{
 const m=m21();let s=applyCommand(m,initialState(m),m.solution[0]);const old=freeze(s);s={...s,variables:{...s.variables,cor:'azul'}};assert.equal(s.memory.corNecessaria.value,'vermelho');s=applyCommand(m,s,m.solution[0]);assert.equal(s.memory.corNecessaria.value,'azul');assert.equal(old.memory.corNecessaria.value,'vermelho');
});
test('alvos consumidos ou coletados não são inspecionáveis nem causam ambiguidade com um alvo vivo',()=>{
 const m=m21(),observe={type:'inspect',source:{type:'entityProperty',relativeTo:'front',property:'cor',entityId:'opcao-vermelho'},into:'corNecessaria'};m.commandOptions.push({id:'readKey',label:'Observar objeto escolhido',node:observe});
 const taken=applyCommand(m,initialState(m),configureCommand(m,'retirarvermelho'));assert.equal(applyCommand(m,taken,observe).reason,'targetConsumed');
 const collected={...initialState(m),collectedIds:['opcao-vermelho'],collectedCount:1};assert.equal(applyCommand(m,collected,observe).reason,'targetConsumed');
 const pair=m21();pair.entities=pair.entities.filter(e=>e.id!=='fechadura'&&e.id!=='opcao-verde');pair.entities[1].interactions[0].when={type:'stateEquals',variable:'cor',value:'vermelho'};
 const generic={type:'interact',relativeTo:'front',actionId:'take'};pair.commandOptions.push({id:'any',label:'Usar o objeto restante',node:generic});const available={...initialState(pair),consumedIds:['opcao-vermelho']};const result=applyCommand(pair,available,generic);assert.equal(result.events[0].entityId,'opcao-azul');assert.equal(result.status,'running');
});
test('seleção explícita e guarda numérica falsa são válidas mas falham sem efeitos parciais',()=>{
 const m=m21(),pick=configureCommand(m,'retirarazul');assert.equal(validateProgram([pick],m),true);const before=freeze(initialState(m)),after=applyCommand(m,before,pick);assert.equal(after.reason,'preconditionFailed');unchanged(before,after);
 const n=m21();n.initialVariables.disponivel=0;n.entities[1].interactions[0].when=cmp(world('disponivel'),'gte',literal(1));const selected=configureCommand(n,'retirarvermelho');assert.equal(validateProgram([selected],n),true);assert.equal(applyCommand(n,initialState(n),selected).reason,'preconditionFailed');
 assert.throws(()=>validateProgram([{...pick,entityId:'forged'}],m));
});
test('inspeção aqui em barreira bloqueada continua possível e seletor forjado é rejeitado',()=>{
 const m=m20(),front=configureCommand(m,'observarPonteA'),here={...front,source:{...front.source,relativeTo:'here'}};m.commandOptions.push({id:'here',label:'Observar passagem atual',node:here});
 const s={...initialState(m),row:3,col:2};const result=applyCommand(m,s,here);assert.equal(result.memory.limiteDaPonte.value,1);assert.equal(result.row,3);
 assert.throws(()=>validateProgram([{...front,source:{...front.source,barrierId:'ponte-b'}}],m));
});
test('editor inclui inspeção e escolhas de alvo em ENTÃO e SENÃO, sem filtro físico',()=>{
 const m=m21(),p=[{type:'if',condition:m.conditionOptions[0].condition,then:[],else:[]}];
 let next=editProgram(p,{type:'add',path:[0,'then'],node:configureCommand(m,'observarFechadura'),mission:m});next=editProgram(next,{type:'add',path:[0,'else'],node:configureCommand(m,'retirarazul'),mission:m});validateProgram(next,m);
 const html=renderProgram(next,m,createExecution(m,next),[0,'else'],false);assert.match(html,/retirarazul/);assert.match(html,/Fechadura/);assert.match(html,/Chave azul/i);assert.match(html,/Cor observada/);assert.match(html,/casa à frente/);
 const forbidden=m20();forbidden.initialVariables.pacotes=4;assert.match(renderCommandPalette(forbidden),/observarPonteA/);assert.equal(editProgram([],{type:'add',nodeType:'move'})[0].type,'move');
});
test('mensagem de falha e capacidade usam dados reais; a casa tentada fica marcada',()=>{
 const m=m20(),failed=end(m,[move]);assert.match(collisionMessage(m,failed),/2 pacotes.*suporta 1/);assert.match(renderBoard(m,failed,move),/failure-target/);assert.match(renderBoard(m,failed,move),/Tentativa bloqueada/);assert.match(passageIndicators(m,initialState(m)),/Ponte A · Capacidade: 1/);assert.match(renderBoard(m,initialState(m)),/Capacidade: 1/);
 assert.match(commandDescription(m,configureCommand(m,'observarPonteA')),/Capacidade.*Ponte A.*casa à frente.*Capacidade observada/);
 const target=m21();assert.match(commandDescription(target,configureCommand(target,'retirarazul')),/chave azul.*Chave azul.*casa à frente/);
});
test('exemplo JSON completo e renomeado executa sem alterações no motor',async()=>{
 const text=await readFile(new URL('../docs/V05-example.json',import.meta.url),'utf8'),m=JSON.parse(text);validateMission(m);assert.deepEqual(JSON.parse(JSON.stringify(m)),m);assert.equal(end(m,m.solution).status,'won');
 let renamed=text;for(const [a,b] of [['fechadura','sensorX'],['opcao-vermelho','itemOne'],['opcao-azul','itemTwo'],['opcao-verde','itemThree'],['take','press'],['liberada','enabled'],['cor','signal'],['corNecessaria','observed'],['vermelho','one'],['azul','two'],['verde','three']])renamed=renamed.replaceAll('"'+a+'"','"'+b+'"');
 const n=JSON.parse(renamed);validateMission(n);for(const variant of missionVariants(n))assert.equal(end(variant,n.solution).status,'won');
});
for(const m of missions.filter(m=>m.id>=20&&m.id<=23))test(`V0.5 demo ${m.id}: mesma AST, passos e variantes isoladas; falhas não concluem sessão`,()=>{
 for(const scenario of missionVariants(m)){
  const program=freeze(structuredClone(m.solution)),input=freeze(structuredClone(scenario));let e=freeze(createExecution(input,program));const states=[e.state];while(!terminal(e.state)){e=freeze(stepExecution(input,program,e));states.push(e.state);}assert.deepEqual(states,simulate(input,program));assert.equal(e.state.status,'won');
 }
 let session=finish(createSession(m,m.solution));assert.equal(session.completed,false);session=finish(startVariantTests(session));assert.equal(session.completed,true);
 if(m.id===20){const trained=finish(createSession(m,seq('AADAA')));assert.equal(trained.execution.state.status,'won');const failed=finish(startVariantTests(trained));assert.equal(failed.execution.state.status,'collision');assert.equal(failed.completed,false);assert.deepEqual(failed.passed,[0]);}
});
test('inspeção de barreira sem seletor usa apenas o alvo geométrico e snapshot',()=>{
 const m=m20(),node=configureCommand(m,'observarPonteA');delete node.source.barrierId;m.commandOptions.push({id:'generic',label:'Observar a passagem à frente',node});
 const s=applyCommand(m,initialState(m),node);assert.equal(s.events[0].barrierId,'ponte-a');assert.equal(s.memory.limiteDaPonte.value,1);assert.equal(s.row,4);
});
test('regras rejeitam propriedades e vínculos inseguros ou não numéricos',()=>{
 for(const properties of [{capacidade:{stateVariable:'missing'}},{capacidade:true},{capacidade:Infinity},JSON.parse('{"__proto__":1}')]){
  const m=m20();m.barriers[0].properties=properties;assert.throws(()=>validateMission(m));
 }
 const m=m21();m.entities[0].properties.cor={stateVariable:'missing'};assert.throws(()=>validateMission(m));
});
test('mudança de carga pela interação afeta a próxima regra física sem atualizar memória sozinha',()=>{
 const m=m20();m.entities=[{id:'control',row:4,col:2,collectible:false,onEnter:[],interactions:[{id:'reduce',relativeTo:['here'],effects:[{type:'set',variable:'pacotes',value:1}]}]}];m.commandOptions.push({id:'reduce',label:'Alterar carga aqui',node:{type:'interact',relativeTo:'here',actionId:'reduce',entityId:'control'}});
 let s=initialState(m);assert.equal(pathClear(m,s),false);s=applyCommand(m,s,configureCommand(m,'reduce'));assert.equal(pathClear(m,s),true);assert.equal(applyCommand(m,s,move).row,3);assert.equal(s.memory.limiteDaPonte.known,false);
});
