import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createExecution,stepExecution,simulate,terminal,validateMission,validateProgram} from '../src/engine.js';
import {DEFAULT_LIMIT,MAX_NODES,MAX_DEPTH} from '../src/interpreter.js';
import {validateLoopOptions,validateLoopNode,createLoop,loopOption,loopPermissions} from '../src/loops.js';
import {createSwitch} from '../src/switches.js';
import {editProgram,countNodes,sequenceAt,encodePath,decodePath,rebaseTarget} from '../src/program.js';
import {sequenceInfo,nodeAt} from '../src/tree.js';
import {renderProgram} from '../src/view.js';
import {renderInlinePalette,renderDecisionTrace,commandMessages,failureMessage} from '../src/command-view.js';
import {renderLoopPalette,renderLoopTrace} from '../src/loop-view.js';
import {insertionLabel} from '../src/branch-view.js';
import {missions,missionVariants} from '../src/missions.js';
import {createSession,stepSession,canStep,startVariantTests} from '../src/session.js';
const move={type:'move'},left={type:'turnLeft'},right={type:'turnRight'};
const free={type:'pathClear'};
const repeat=(times,body=[])=>({type:'for',times,body});
const until=(condition,body=[])=>({type:'while',condition,body});
const eq=(variable,value)=>({type:'stateEquals',variable,value});
const mem=(value=true)=>({type:'memoryEquals',variable:'known',value});
const ifNode=(then=[],otherwise=[])=>({type:'if',condition:free,then,else:otherwise});
const freeze=value=>{if(value&&typeof value==='object'){Object.values(value).forEach(freeze);Object.freeze(value);}return value;};
const end=(m,p,options)=>simulate(m,p,options).at(-1);
const checks=states=>states.flatMap(s=>s.events.filter(event=>event.type==='loopCheck'));
const finish=s=>{let guard=0;while(canStep(s)){assert(++guard<11000);s=stepSession(s);}return s;};
function base() {return {
 id:'synthetic',grid:{width:5,height:5,obstacles:[]},start:{row:4,col:0,direction:'L'},goal:{row:0,col:4},
 initialVariables:{count:0,open:true},robotMemory:{known:{type:'boolean',initial:true}},
 loopOptions:[1,2,4,20].map(times=>({id:`n${times}`,label:`Repetir ${times} vezes`,kind:'for',times})).concat([
  {id:'free',label:'O caminho está livre?',kind:'while',condition:free},
  {id:'open',label:'A passagem está aberta?',kind:'while',condition:eq('open',true)},
  {id:'memory',label:'Guardei Sim?',kind:'while',condition:mem()}]),
 switchOptions:[{id:'count',label:'Escolher quantidade',selector:{kind:'worldVariable',name:'count'},cases:[{value:0,label:'Zero'},{value:1,label:'Um'}]}]
};}
function statesByStep(m,p,options) {
 let execution=freeze(createExecution(m,p,options));const states=[execution.state];
 while(!terminal(execution.state)){const previous=execution;execution=freeze(stepExecution(m,p,execution));assert(execution.state.instructionPointer-previous.state.instructionPointer<=1);states.push(execution.state);}
 return {execution,states};
}
for(const times of [1,2,4,20])for(const body of [[],[right],[right,left]])test(`for ${times}, corpo ${body.length}: N+1 checks, contagem e retorno`,()=>{
 const m=freeze(base()),p=freeze([repeat(times,body),left]);const {states,execution}=statesByStep(m,p);
 assert.deepEqual(states,simulate(m,p));assert.equal(execution.state.status,'finished');assert.equal(execution.state.instructionPointer,times*(1+body.length)+2);
 const events=checks(states);assert.equal(events.length,times+1);assert.deepEqual(events.map(e=>e.iteration),Array.from({length:times+1},(_,i)=>i+1));
 events.forEach((event,i)=>assert.deepEqual(event,{type:'loopCheck',loopType:'for',path:[0],iteration:i+1,times,completed:i,result:i<times}));
 assert.equal(countNodes(p),body.length+2);assert.equal(p[0].body.length,body.length);assert.equal(execution.state.memory.known.value,true);assert.equal(execution.state.variables.count,0);
});
test('for último bloco e corpos terminando em if/switch retornam ao controle',()=>{
 const m=base(),choice=createSwitch(m,'count');choice.cases[0].body=[left];
 const p=[repeat(2,[ifNode([right]),choice])];const states=simulate(m,p);
 assert.equal(end(m,p).instructionPointer,11);assert.equal(end(m,p).direction,'L');assert.equal(checks(states).length,3);assert.equal(end(m,p).status,'finished');
});
for(const kind of ['won','collision','actionFailed'])test(`terminal ${kind} no corpo não cria checks finais`,()=>{
 const m=base();let body=[move,right];
 if(kind==='won')m.goal={row:4,col:1};
 if(kind==='collision')m.grid.obstacles=[{row:4,col:1}];
 if(kind==='actionFailed') {m.robotMemory.known.initial=null;m.conditionOptions=[{id:'known',label:'Sei?',condition:mem()}];body=[{type:'if',condition:mem(),then:[move],else:[right]},move];}
 const states=simulate(m,[repeat(4,body),left]);assert.equal(states.at(-1).status,kind);assert.equal(states.at(-1).instructionPointer,2);assert.equal(checks(states).length,1);
 assert.equal(states.at(-1).direction,'L');assert.deepEqual(stepExecution(m,[repeat(4,body),left],statesByStep(m,[repeat(4,body),left]).execution).state,states.at(-1));
});
test('while falso inicialmente pula corpo e segue em um check',()=>{
 const m=base();m.initialVariables.open=false;const p=[until(eq('open',true),[move]),left];const states=simulate(m,p);
 assert.equal(states.at(-1).col,0);assert.equal(states.at(-1).direction,'N');assert.equal(states.at(-1).instructionPointer,2);assert.equal(checks(states)[0].result,false);
});
test('while pathClear reavalia posição e termina na borda, sem colidir',()=>{
 const m=base(),p=[until(free,[move]),left];const states=simulate(m,p);assert.equal(states.at(-1).col,4);assert.equal(states.at(-1).status,'finished');assert.equal(states.at(-1).instructionPointer,10);
 assert.deepEqual(checks(states).map(e=>[e.iteration,e.result]),[[1,true],[2,true],[3,true],[4,true],[5,false]]);
});
function interactive() {
 const m=base();m.entities=[{id:'station',row:4,col:0,collectible:false,onEnter:[],interactions:[{id:'increment',relativeTo:['here'],effects:[{type:'increment',variable:'count',amount:1}]},{id:'close',relativeTo:['here'],effects:[{type:'set',variable:'open',value:false}]}]}];
 const act=actionId=>({type:'interact',entityId:'station',relativeTo:'here',actionId});
 m.commandOptions=['increment','close'].map(id=>({id,label:id,node:act(id)}));return {m,act};
}
test('while observa incrementos por interação repetível sem cache',()=>{
 const {m,act}=interactive(),condition={type:'numberCompare',left:{kind:'worldVariable',name:'count'},operator:'lt',right:{kind:'literal',value:3}};
 m.loopOptions.push({id:'three',label:'Ainda falta chegar a três?',kind:'while',condition});const p=[until(condition,[act('increment')])];
 const states=simulate(m,p);assert.equal(states.at(-1).variables.count,3);assert.equal(states.at(-1).instructionPointer,7);assert.deepEqual(checks(states).map(e=>e.result),[true,true,true,false]);
 assert.equal(states.at(-1).usedInteractions.length,0);
});
for(const command of ['setMemory','inspect'])test(`while consulta memória atualizada por ${command}`,()=>{
 const m=base();let node;
 if(command==='setMemory')node={type:'setMemory',variable:'known',value:false};
 else {m.grid.cells=[{row:4,col:1,properties:{value:false}}];node={type:'inspect',source:{type:'cellProperty',relativeTo:'front',property:'value'},into:'known'};}
 m.commandOptions=[{id:'update',label:'Atualizar informação',node}];const states=simulate(m,[until(mem(),[node])]);
 assert.equal(states.at(-1).memory.known.value,false);assert.equal(states.at(-1).instructionPointer,3);assert.deepEqual(checks(states).map(e=>e.result),[true,false]);
});
test('while pathClear usa a física corrente de barreira fechada pelo corpo',()=>{
 const {m,act}=interactive();m.barriers=[{id:'gate',row:4,col:1,passableWhen:eq('open',true)}];
 const states=simulate(m,[until(free,[act('close')])]);assert.deepEqual(checks(states).map(e=>e.result),[true,false]);assert.equal(states.at(-1).variables.open,false);assert.equal(states.at(-1).col,0);assert.equal(states.at(-1).instructionPointer,3);
});
test('while desconhecido falha em um check, sem converter a falso ou alterar estado',()=>{
 const m=base();m.robotMemory.known.initial=null;const p=[until(mem(),[move]),right],states=simulate(m,p),last=states.at(-1);
 assert.equal(last.status,'actionFailed');assert.equal(last.reason,'memoryUnknown');assert.equal(last.instructionPointer,1);assert.equal(checks(states).length,0);assert.deepEqual(last.memory,states[0].memory);assert.deepEqual(last.variables,states[0].variables);assert.equal(last.col,0);
 assert.deepEqual(last.events[0].loop,{loopType:'while',path:[0],iteration:1});assert.match(failureMessage(m,last),/Ainda não sei/);assert.match(renderLoopTrace(m,statesByStep(m,p).execution,p),/não consigo decidir/);
});
for(const limit of [1,2,17,1000,10000])test(`while vazio infinito: orçamento ${limit} é incremental e inclui checks`,()=>{
 const m=base(),p=[until(eq('open',true))],{states,execution}=statesByStep(m,p,{instructionLimit:limit});
 assert.equal(execution.state.status,'limit');assert.equal(execution.state.instructionPointer,limit);assert.equal(checks(states).length,limit);assert.equal(states.length,limit+2);
 assert.deepEqual(execution.state.events[0],{type:'limit',loop:{loopType:'while',path:[0],iteration:limit+1},instructionLimit:limit});assert.equal(execution.state.col,0);assert.match(renderLoopTrace(m,execution,p),/Veja se algo faz a condição mudar/);
});
test('limite no corpo informa o controlador sem checks fictícios',()=>{
 const m=base(),p=[repeat(20,[right,left])],states=simulate(m,p,{instructionLimit:2});assert.equal(checks(states).length,1);assert.equal(states.at(-1).events[0].loop.iteration,1);assert.equal(states.at(-1).instructionPointer,2);
 assert.equal(DEFAULT_LIMIT,1000);for(const instructionLimit of [0,-1,1.5,'2',10001,NaN,Infinity])assert.throws(()=>createExecution(m,p,{instructionLimit}));
});
test('movimento fisicamente proibido dentro do for é aceito na AST e falha em runtime',()=>{
 const m=base();m.initialVariables.load=4;m.barriers=[{id:'gate',row:4,col:1,properties:{capacity:2},failureCode:'capacityExceeded',passableWhen:{type:'numberCompare',left:{kind:'worldVariable',name:'load'},operator:'lte',right:{kind:'barrierProperty',name:'capacity'}}}];
 const p=[repeat(4,[move])];assert.equal(validateProgram(p,m),true);const states=simulate(m,p),last=states.at(-1);assert.equal(last.status,'collision');assert.equal(last.reason,'capacityExceeded');assert.equal(last.col,0);assert.equal(last.variables.load,4);assert.equal(checks(states).length,1);
});
test('for em for, if no for e for no if retomam corretamente todos os pais',()=>{
 const m=base(),p=[ifNode([repeat(2,[repeat(2,[right,left]),ifNode([right,left])])]),move];
 const states=simulate(m,p);assert.equal(states.at(-1).col,1);assert.equal(states.at(-1).direction,'L');assert.equal(states.at(-1).instructionPointer,25);assert.equal(checks(states).length,9);assert.deepEqual(statesByStep(freeze(m),freeze(p)).states,states);
});
test('while em while, switch em while e while/for em casos/padrão',()=>{
 const {m,act}=interactive();const choice=createSwitch(m,'count');choice.cases[0].body=[repeat(2,[right,left]),until(eq('open',true),[act('close')])];
 const p=[until(eq('open',true),[until(eq('open',true),[choice])]),move];const states=simulate(m,p);assert.equal(states.at(-1).status,'finished');assert.equal(states.at(-1).variables.open,false);assert.equal(states.at(-1).col,1);assert.deepEqual(checks(states).map(e=>e.loopType),['while','while','for','for','for','while','while','while','while']);
 m.initialVariables.count=7;const d=createSwitch(m,'count');d.default=[repeat(1,[until(eq('open',true),[act('close')])])];assert.equal(end(m,[d,move]).col,1);
});
for(const times of [0,-1,1.2,'4',NaN,Infinity,21,Number.MAX_SAFE_INTEGER+1])test(`for rejeita times ${String(times)}`,()=>{
 const m=base();m.loopOptions[0].times=times;assert.throws(()=>validateMission(m));assert.throws(()=>createExecution(base(),[repeat(times)]));
});
test('catálogo valida tipos, campos, IDs, labels, quantidade e duplicatas',()=>{
 const changes=[m=>m.loopOptions={},m=>m.loopOptions[0].id='__proto__',m=>m.loopOptions[0].label=' ',m=>m.loopOptions[0].kind='repeat',m=>m.loopOptions[0].extra=true,m=>m.loopOptions[0].condition=free,m=>m.loopOptions[4].times=2,m=>m.loopOptions[1].id='n1',m=>m.loopOptions.push({...m.loopOptions[0],id:'duplicate'}),m=>m.loopOptions=Array.from({length:21},(_,i)=>({id:`o${i}`,kind:'for',times:i+1,label:'Repetir'})),m=>m.loopOptions[4].condition={type:'unknown'},m=>delete m.loopOptions[4].condition];
 for(const change of changes){const m=base();change(m);assert.throws(()=>validateLoopOptions(m));assert.throws(()=>validateMission(m));}
});
test('condições canônicas ignoram ordem de chaves, rejeitam duplicatas e mantêm arrays ordenados',()=>{
 const m=base();m.loopOptions=[{id:'a',kind:'while',label:'Aberta?',condition:{type:'stateEquals',variable:'open',value:true}}];
 const reordered={value:true,variable:'open',type:'stateEquals'};assert.equal(validateProgram([until(reordered)],m),true);assert.equal(loopOption(m,until(reordered)).id,'a');
 m.loopOptions.push({id:'b',kind:'while',label:'Também aberta?',condition:reordered});assert.throws(()=>validateLoopOptions(m),/duplicada/);
});
test('valida condições gerais existentes, sem limitar pelo menu do SE',()=>{
 const m=base();m.conditionOptions=[{id:'free',label:'Livre?',condition:free}];
 const conditions=[free,eq('open',true),mem(),{type:'stateAtLeast',variable:'count',value:0},{type:'atGoal'},{type:'cellPropertyEquals',relativeTo:'front',property:'mark',value:'x'},{type:'numberCompare',left:{kind:'worldVariable',name:'count'},operator:'eq',right:{kind:'literal',value:0}},{type:'all',conditions:[free,eq('open',true)]}];
 m.loopOptions=conditions.map((condition,i)=>({id:`c${i}`,kind:'while',label:'Pergunta',condition}));assert.equal(validateMission(m),true);for(const condition of conditions)assert.equal(validateProgram([until(condition)],m),true);
 for(const condition of [{type:'all',conditions:[]},{type:'numberCompare',left:{kind:'barrierProperty',name:'capacity'},operator:'lt',right:{kind:'literal',value:3}},{type:'memoryEquals',variable:'undeclared',value:1}])assert.throws(()=>validateMission({...m,loopOptions:[{id:'bad',kind:'while',label:'Inválida',condition}]}));
});
test('JSON hostil não executa getters, funções ou ciclos na validação',()=>{
 for(const where of ['options','node']) {
  const m=base(),node=repeat(2);let called=false;const value=where==='options'?m.loopOptions[0]:node;
  Object.defineProperty(value,'times',{enumerable:true,get(){called=true;return 2;}});
  assert.throws(()=>where==='options'?createLoop(m,'n1'):validateLoopNode(m,node));assert.equal(called,false);
 }
 for(const mutate of [x=>x.body=()=>[],x=>x.body=x,x=>x.body=[{type:'move',callback:()=>1}]]){const node=repeat(2);mutate(node);assert.throws(()=>createExecution(base(),[node]));}
 const c={type:'all',conditions:[]};c.conditions.push(c);assert.throws(()=>validateMission({...base(),loopOptions:[{id:'cyclic',label:'Não',kind:'while',condition:c}]}));
});
test('AST adulterada não ganha autorização só pelo tipo',()=>{
 const m=base();for(const node of [{type:'for',times:3,body:[]},{type:'for',times:2,body:{}},{type:'for',times:2},{type:'for',times:2,body:[],optionId:'n2'},{type:'while',condition:eq('open',false),body:[]},{type:'while',condition:free,body:move},{type:'while',condition:free,body:[],times:2}])assert.throws(()=>createExecution(m,[node]));
 for(const loopOptions of [undefined,[]]){const n={...m,loopOptions};if(loopOptions===undefined)delete n.loopOptions;for(const node of [repeat(1),until(free)])assert.throws(()=>validateProgram([node],n));assert.equal(renderLoopPalette(n),'');}
});
test('variantes preservam permissões exatas, normalizadas, com estados isolados',()=>{
 const m=base();m.variants=[{id:'a'},{id:'b',initialVariables:{count:3,open:false},loopOptions:structuredClone(m.loopOptions).reverse()}];assert.equal(validateMission(m),true);
 for(const change of [options=>options.pop(),options=>options[0].times=3,options=>options[0].id='other',options=>options.at(-1).condition.value=false]){const n=structuredClone(m);n.variants[1].loopOptions=structuredClone(m.loopOptions);change(n.variants[1].loopOptions);assert.throws(()=>validateMission(n));assert.throws(()=>createSession(n,[repeat(2)]));}
 m.variants[1].loopOptions=m.loopOptions.map(option=>option.kind==='while'?{...option,condition:Object.fromEntries(Object.entries(option.condition).reverse())}:option);assert.equal(loopPermissions(m),loopPermissions({...m,...m.variants[1]}));
});
for(const path of [[],[0],[0,'body'],[0,'body',1],[2,'cases',0,'body',1,'body',0],[0,'body',1,'then',0,'body']])test(`caminho loop roundtrip ${JSON.stringify(path)}`,()=>assert.deepEqual(decodePath(encodePath(path)),path));
test('caminhos body exigem pai correto; índices e chaves perigosas falham',()=>{
 for(const path of [[0,'body',NaN],[-1,'body'],[0,'__proto__'],[0,'body','constructor'],[0,'cases',0,'body','body'],[0,'body',1.5]])assert.throws(()=>encodePath(path));
 for(const path of ['0.body.NaN','0.body.-1','0.body.01','0.body.__proto__','0.cases.0.body.body','0.body.1.while'])assert.throws(()=>decodePath(path));
 for(const node of [move,ifNode(),createSwitch(base(),'count')])assert.throws(()=>sequenceAt([node],[0,'body']));
 assert.throws(()=>sequenceAt([repeat(2)],[0,'then']));assert.throws(()=>nodeAt([repeat(2)],[0,'body']));
});
test('edição imutável dentro de if, switch e laços; troca de preset conserva corpo',()=>{
 const m=base();let p=editProgram([],{type:'add',nodeType:'for',loopOptionId:'n2',mission:m});p=editProgram(p,{type:'add',path:[0,'body'],nodeType:'switch',switchOptionId:'count',mission:m});
 const path=[0,'body',0,'cases',1,'body'];p=editProgram(p,{type:'add',path,nodeType:'while',loopOptionId:'free',mission:m});p=editProgram(p,{type:'add',path:[...path,0,'body'],nodeType:'if',mission:m});
 p=editProgram(p,{type:'add',path:[...path,0,'body',0,'else'],nodeType:'for',loopOptionId:'n1',mission:m});
 const original=freeze(p),changed=editProgram(original,{type:'loopOption',path:[0],loopOptionId:'n4',mission:m});assert.equal(changed[0].times,4);assert.deepEqual(changed[0].body,original[0].body);assert.equal(original[0].times,2);
 const whileChanged=editProgram(original,{type:'loopOption',path:[...path,0],loopOptionId:'open',mission:m});assert.deepEqual(whileChanged[0].body[0].cases[1].body[0].body,original[0].body[0].cases[1].body[0].body);
 assert.throws(()=>editProgram(original,{type:'loopOption',path:[0],loopOptionId:'free',mission:m}),/trocar o tipo/);assert.throws(()=>editProgram(original,{type:'loopOption',path:[0],loopOptionId:'absent',mission:m}));
 assert.throws(()=>editProgram([],{type:'add',nodeType:'for',loopOptionId:'free',mission:m}));assert.throws(()=>editProgram([],{type:'add',node:repeat(2)}));
 assert.equal(countNodes(original),5);assert.equal(sequenceInfo(original,[...path,0,'body',0,'else',0,'body']).depth,5);
});
test('mover/remover ancestrais conserva destino e irmãos; reconfigurar conserva seleção',()=>{
 const m=base(),original=freeze([repeat(2,[move,right]),left]);let p=editProgram(original,{type:'move',path:[0],offset:1,mission:m});
 const target=rebaseTarget(p,[0,'body'],{type:'move',path:[0],offset:1});assert.deepEqual(target,[1,'body']);assert.deepEqual(p[0],left);
 p=editProgram(p,{type:'remove',path:[1,'body',0],mission:m});assert.deepEqual(p[1].body,[right]);assert.deepEqual(original[0].body,[move,right]);
 p=editProgram(p,{type:'loopOption',path:[1],loopOptionId:'n4',mission:m});assert.deepEqual(rebaseTarget(p,target,{type:'loopOption',path:[1]}),target);
 p=editProgram(p,{type:'remove',path:[1],mission:m});assert.deepEqual(rebaseTarget(p,target,{type:'remove',path:[1]}),[]);assert.deepEqual(p,[left]);
});
test('profundidade 8 e 300 nós são estruturais, não multiplicados por iterações',()=>{
 const m=base();let p=[right];for(let i=0;i<8;i++)p=[repeat(20,p)];assert.equal(MAX_DEPTH,8);assert.equal(MAX_NODES,300);assert.equal(validateProgram(p,m),true);assert.equal(countNodes(p),9);
 assert.throws(()=>validateProgram([repeat(20,p)],m));assert.throws(()=>countNodes([repeat(20,p)]));
 const max=[repeat(20,Array.from({length:299},()=>right))];assert.equal(countNodes(max),300);assert.equal(validateProgram(max,m),true);max[0].body.push(right);assert.throws(()=>countNodes(max));assert.throws(()=>validateProgram(max,m));
});
test('editor mostra um CORPO, paleta local única, breadcrumbs e progresso',()=>{
 const m=base(),p=[repeat(4,[move])];let execution=createExecution(m,p);execution=stepExecution(m,p,execution);
 const html=renderProgram(p,m,execution,[0,'body'],false);assert.match(html,/REPITA 4 VEZES/);assert.match(html,/CORPO/);assert.match(html,/data-target="0.body"/);assert.match(html,/Repetição 1 de 4/);assert.match(html,/aria-current="step"/);assert.equal((html.match(/class="branch-tools"/g)??[]).length,1);
 assert.match(renderLoopTrace(m,execution,p),/Repetição 1 de 4/);assert.match(commandMessages(m,execution.state).join(' '),/Vou executar/);
 assert.equal(insertionLabel(m,p,[0,'body']),'Programa principal → REPITA 4 VEZES → CORPO');
 execution=stepExecution(m,p,execution);assert.match(renderProgram(p,m,execution,[],false),/executing-branch/);assert.match(renderLoopTrace(m,execution,p),/Executando o CORPO/);
 const last=statesByStep(m,p).execution;assert.match(renderLoopTrace(m,last,p),/Já repeti 4 vezes/);
 const w=[until(free,[move])],states=simulate(m,w);assert.match(commandMessages(m,states[1]).join(' '),/Sim. Vou repetir/);assert.match(commandMessages(m,states.at(-1)).join(' '),/Não. Vou continuar/);
});
test('loop não sobrescreve rastreio de if/switch nem altera sua decisão',()=>{
 const m=base(),p=[ifNode([repeat(1,[right])])];let execution=createExecution(m,p);execution=stepExecution(m,p,execution);const decision=structuredClone(execution.decision);assert.match(renderDecisionTrace(m,execution.state),/PERGUNTA/);
 execution=stepExecution(m,p,execution);assert.deepEqual(execution.decision,decision);assert.equal(renderDecisionTrace(m,execution.state),'');assert.match(renderLoopTrace(m,execution,p),/Repetição/);
});
for(const m of missions.filter(m=>m.id<=23))test(`missão ${m.id}: paletas sem REPITA/ENQUANTO e soluções preservadas`,()=>{
 assert.equal(m.loopOptions,undefined);assert.equal(renderLoopPalette(m),'');assert.doesNotMatch(renderInlinePalette(m,''),/data-inline-loop|REPITA|ENQUANTO/);
 for(const scenario of missionVariants(m))assert.equal(end(scenario,m.solution).status,'won');
});
for(const demo of missions.filter(m=>m.id>=24))test(`demo ${demo.id}: AST única, estados equivalentes, pausa/reset/variantes isolados`,()=>{
 const program=freeze(structuredClone(demo.solution));
 for(const [i,scenario] of missionVariants(demo).entries()) {
  const {states,execution}=statesByStep(freeze(scenario),program);assert.deepEqual(states,simulate(scenario,program));assert.equal(execution.state.status,'won');
  assert.equal(execution.state.instructionPointer,demo.id===24?11:i===0?7:9);assert.equal(checks(states).at(-1).result,false);assert.equal(checks(states).filter(e=>e.result).length,demo.id===24?4:i===0?2:3);
 }
 let s=createSession(demo,program);s=stepSession(stepSession(s));const paused=freeze(s),snapshot=structuredClone(paused.execution);
 renderLoopTrace(paused.scenarios[0],paused.execution,program);renderProgram(program,paused.scenarios[0],paused.execution,[],false);
 s=stepSession(paused);assert.deepEqual(paused.execution,snapshot);assert.equal(s.execution.state.instructionPointer,3);assert.equal(s.execution.state.events[0].iteration,2);assert.equal(paused.execution.state.instructionPointer,2);s=finish(s);
 if(demo.id===25){assert.equal(s.completed,false);s=startVariantTests(s);assert.equal(s.execution.state.instructionPointer,0);assert.equal(s.execution.frames.length,1);s=finish(s);}assert.equal(s.completed,true);
 const reset=createSession(demo,program);assert.equal(reset.execution.state.instructionPointer,0);assert.deepEqual(reset.execution.frames,[{path:[],index:0}]);assert.equal(reset.execution.state.col,0);assert.deepEqual(reset.program,program);
});
test('UI mantém confirmação antes de remover corpos, timers incrementais e estilos restritos',async()=>{
 const ui=await readFile(new URL('../src/ui.js',import.meta.url),'utf8'),css=await readFile(new URL('../src/style.css',import.meta.url),'utf8');
 assert.match(ui,/\['if','switch','for','while'\]\.includes\(node.type\).*window.confirm/);assert.match(ui,/if\(lastLoopKey!==loopKey\)/);assert.match(ui,/\$\('\.palette'\)\.hidden=target.length>0/);assert.match(ui,/setTimeout\(tick/);assert.match(css,/@media\(prefers-reduced-motion:reduce\)\{\.loop-block/);assert.match(css,/\.loop-block .row-controls button[^}]*min-height:44px/);
});
test('exemplo JSON completo, renomeável e serializável, sem regra específica no motor',async()=>{
 const text=await readFile(new URL('../docs/V07-example.json',import.meta.url),'utf8'),m=JSON.parse(text);assert.equal(validateMission(m),true);assert.equal(end(m,m.solution).status,'won');assert.deepEqual(JSON.parse(JSON.stringify(m)),m);
 let renamed=text;for(const [from,to] of [['count','total'],['station','dispositivo'],['press','acionar'],['three','meta'],['memoryFlag','observado'],['known','informacao']])renamed=renamed.replaceAll(`"${from}"`,`"${to}"`);
 const n=JSON.parse(renamed);n.id='independente';assert.equal(validateMission(n),true);assert.equal(end(n,n.solution).status,'won');
});
for(const outcome of ['won','collision','actionFailed'])test(`while interrompido por ${outcome} conserva rastreabilidade, sem checks posteriores`,()=>{
 const m=base();let body=[move,right];
 if(outcome==='won')m.goal={row:4,col:1};
 if(outcome==='collision')m.grid.obstacles=[{row:4,col:1}];
 if(outcome==='actionFailed'){m.robotMemory.known.initial=null;m.conditionOptions=[{id:'known',label:'Sei?',condition:mem()}];body=[{type:'if',condition:mem(),then:[move],else:[]},move];}
 const p=[until(eq('open',true),body)],{execution,states}=statesByStep(m,p);assert.equal(execution.state.status,outcome);assert.equal(execution.state.instructionPointer,2);assert.equal(checks(states).length,1);assert.equal(execution.state.events[0].loop.loopType,'while');
 assert.doesNotMatch(renderLoopTrace(m,execution,p),/Executando o CORPO/);
});
test('progresso do corpo mostra a iteração executada, sem adiantar no último comando',()=>{
 const m=base(),p=[repeat(2,[right])];let e=createExecution(m,p);e=stepExecution(m,p,e);e=stepExecution(m,p,e);
 assert.equal(e.frames.at(-1).completed,1);assert.match(renderProgram(p,m,e,[],false),/Repetição 1 de 2/);assert.match(renderLoopTrace(m,e,p),/Repetição 1 de 2/);assert.equal(e.state.events[0].loop.iteration,1);
 e=stepExecution(m,p,e);assert.match(renderLoopTrace(m,e,p),/Repetição 2 de 2/);
});
