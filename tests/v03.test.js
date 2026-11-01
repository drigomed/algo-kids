import {test} from 'node:test';
import assert from 'node:assert/strict';
import {initialState,applyCommand,simulate,validateMission,createExecution,stepExecution,terminal,evaluateCondition} from '../src/engine.js';
import {validateCondition,passage,pathClear,frontCell,cellProperties} from '../src/rules.js';
import {conditionOptions,defaultCondition,configureCondition,validateDecision,conditionQuestion} from '../src/condition-options.js';
import {renderProgram,renderBoard,eventMessages,worldIndicators,describeEnvironment} from '../src/view.js';
import {missions,missionVariants} from '../src/missions.js';
import {createSession,stepSession,startVariantTests,canStep} from '../src/session.js';
import {editProgram} from '../src/program.js';
const eq=(variable,value)=>({type:'stateEquals',variable,value});
const set=(variable,value)=>({type:'set',variable,value});
const sensor=(property='signal',value='green')=>({type:'cellPropertyEquals',relativeTo:'front',property,value});
const entity=(id,row,col,onEnter,collectible=false)=>({id,row,col,onEnter,collectible});
const base=()=>({grid:{width:5,height:5,obstacles:[]},start:{row:4,col:0,direction:'L'},goal:{row:0,col:4},initialVariables:{flag:false,count:0,color:'red'},entities:[]});
const command=(m,s,type='move')=>applyCommand(m,s,{type});
function freeze(value){if(value&&typeof value==='object'){Object.values(value).forEach(freeze);Object.freeze(value);}return value;}
function finish(session){let steps=0;while(canStep(session)){assert(++steps<1000);session=stepSession(session);}return session;}

test('igualdade usa tipo e valor, sem coerção, para booleanos, texto e números',()=>{
 const m=base(),s=initialState(m);s.variables.flag=true;s.variables.count=1;s.variables.color='1';
 for(const [name,value] of [['flag',true],['count',1],['color','1']]){validateCondition(eq(name,value),m.initialVariables);assert.equal(evaluateCondition(m,s,eq(name,value)),true);}
 for(const [name,value] of [['flag',1],['count','1'],['color',1]]){assert.equal(evaluateCondition(m,s,eq(name,value)),false);assert.throws(()=>validateCondition(eq(name,value),m.initialVariables));}
 for(const c of [eq('missing',true),eq('__proto__',true),eq('constructor',true),eq('count',NaN),eq('count',Infinity)])assert.throws(()=>validateCondition(c,m.initialVariables));
});
test('sensor observa orientação, limites e propriedades presentes ou ausentes',()=>{
 const m=base();m.start={row:2,col:2,direction:'N'};m.grid.cells=[{row:1,col:2,properties:{signal:'green'}},{row:2,col:3,properties:{signal:'red'}}];
 validateMission(m);const s=initialState(m);
 assert.equal(evaluateCondition(m,s,sensor()),true);
 assert.equal(evaluateCondition(m,{...s,direction:'L'},sensor()),false);
 assert.equal(evaluateCondition(m,{...s,direction:'L'},sensor('signal','red')),true);
 assert.equal(evaluateCondition(m,{...s,direction:'S'},sensor()),false);
 assert.equal(evaluateCondition(m,{...s,row:0,direction:'N'},sensor()),false);
 assert.equal(evaluateCondition(m,s,sensor('missing')),false);
});
test('propriedade vinculada reflete mudança do estado na mesma execução',()=>{
 const m=base();m.entities=[entity('a',4,1,[set('color','green')])];m.grid.cells=[{row:4,col:2,properties:{signal:{stateVariable:'color'}}}];
 const before=initialState(m),after=command(m,before);
 assert.equal(before.variables.color,'red');assert.equal(cellProperties(m,after,{row:4,col:2}).signal,'green');assert.equal(evaluateCondition(m,after,sensor()),true);
});
test('sensor de passagem e movimento concordam em limites, rochas e barreiras',()=>{
 for(const block of ['boundary','obstacle','barrier','open']){
  const m=base();if(block==='boundary')m.start.col=4;
  if(block==='obstacle')m.grid.obstacles=[{row:4,col:1}];
  if(['barrier','open'].includes(block)){m.barriers=[{id:'b',row:4,col:1,passableWhen:eq('flag',true)}];m.initialVariables.flag=block==='open';}
  const s=initialState(m),access=passage(m,s,frontCell(s)),next=command(m,s);
  assert.equal(pathClear(m,s),access.passable);assert.equal(next.status==='collision',!access.passable);
  if(!access.passable)assert.equal(next.lastEvent,access.reason);
 }
});
test('efeito abre barreira imediatamente e emite mudança de passagem',()=>{
 const m=base();m.entities=[entity('a',4,1,[set('flag',true)],true)];m.barriers=[{id:'b',row:4,col:2,passableWhen:eq('flag',true)}];
 const before=initialState(m),after=command(m,before);
 assert.match(renderBoard(m,before),/barrier closed/);assert.match(renderBoard(m,after),/barrier open/);
 assert(after.events.some(e=>e.type==='barrierChanged'&&e.passable));assert.equal(pathClear(m,after),true);assert.equal(command(m,after).col,2);
});
test('barreira baseada em collectedCount muda depois da coleta',()=>{
 const m=base();m.entities=[entity('a',4,1,[],true)];m.barriers=[{id:'b',row:4,col:2,passableWhen:{type:'stateAtLeast',variable:'collectedCount',value:1}}];
 const after=command(m,initialState(m));assert.equal(pathClear(m,after),true);assert(after.events.some(e=>e.type==='barrierChanged'&&e.passable));
});
test('movimento bloqueado não entra, não coleta e não executa ações',()=>{
 const m=base();m.entities=[entity('a',4,1,[set('flag',true)],true)];m.barriers=[{id:'b',row:4,col:1,passableWhen:eq('flag',true)}];
 const before=freeze(initialState(m)),after=command(m,before);
 assert.equal(after.col,0);assert.equal(after.variables.flag,false);assert.equal(after.collectedCount,0);assert.deepEqual(after.events,[{type:'collision',reason:'barrier',barrierId:'b'}]);
});
test('barreira pode fechar sobre o robô: sair é permitido, reentrar não',()=>{
 const m=base();m.initialVariables.flag=true;m.barriers=[{id:'b',row:4,col:1,passableWhen:eq('flag',true)}];m.entities=[entity('a',4,1,[set('flag',false)])];
 let s=command(m,initialState(m));assert.equal(s.col,1);assert.equal(s.variables.flag,false);
 assert(s.events.some(e=>e.type==='barrierChanged'&&!e.passable));
 s=command(m,s);assert.equal(s.col,2);s=command(m,command(m,s,'turnRight'),'turnRight');s=command(m,s);assert.equal(s.status,'collision');assert.equal(s.col,2);
});
test('guardas observam ações anteriores e ordem das entidades, inclusive coleta anterior',()=>{
 const m=base();m.entities=[entity('primeira',4,1,[set('flag',true),{when:eq('flag',true),actions:[{type:'increment',variable:'count',amount:1}]}],true),entity('segunda',4,1,[{when:{type:'all',conditions:[eq('count',1),{type:'stateAtLeast',variable:'collectedCount',value:1}]},actions:[set('color','green')]},{when:eq('flag',false),actions:[set('count',99)]}])];
 const before=freeze(initialState(m)),after=command(m,before);
 assert.deepEqual(after.variables,{flag:true,count:1,color:'green'});assert.equal(after.collectedCount,1);
 assert.deepEqual(after.events.filter(e=>e.type==='effectCondition').map(e=>e.result),[true,true,false]);
 assert.deepEqual(after.events.filter(e=>e.type==='variableChanged').map(e=>e.variable),['flag','count','color']);
 assert.deepEqual(after.events.filter(e=>e.type==='entityEntered').map(e=>e.entityId),['primeira','segunda']);
 assert.deepEqual(before.variables,{flag:false,count:0,color:'red'});
});
test('entrega condicional não ocorre sem estado requerido e exige destino',()=>{
 const m=missionVariants(missions.find(m=>m.id===16))[0],empty={...m,entities:m.entities.filter(e=>!e.collectible)};
 const failed=simulate(empty,[{type:'move'},{type:'move'},{type:'move'}]).at(-1);
 assert.equal(failed.status,'finished');assert.equal(failed.variables.entregue,false);assert.equal(failed.variables.comPacote,false);
 assert(failed.events.some(e=>e.type==='effectCondition'&&!e.result));
 const won=simulate(m,m.solution).at(-1);assert.equal(won.variables.entregue,true);assert.equal(won.variables.comPacote,false);assert.equal(won.status,'won');
});
test('reinício e variantes restauram estado, sensores e barreiras',()=>{
 const m=missions.find(m=>m.id===15),scenarios=missionVariants(m);const a=simulate(scenarios[0],m.solution).at(-1),b=simulate(scenarios[1],m.solution).at(-1);
 assert.equal(a.variables.ponteAberta,true);assert.equal(b.variables.ponteAberta,false);
 const reset=initialState(scenarios[0]);assert.equal(reset.variables.ponteAberta,false);assert.equal(reset.collectedCount,0);
 assert.equal(passage(scenarios[0],reset,scenarios[0].barriers[0]).passable,false);
 let session=finish(createSession(m,m.solution));session=finish(startVariantTests(session));assert.equal(session.completed,true);assert.deepEqual(session.passed,[0,1]);
});
test('rejeita sensores, barreiras, guardas, vínculos e perguntas inválidos',()=>{
 const cases=[m=>m.grid.cells=[{row:5,col:0,properties:{signal:'green'}}],m=>m.grid.cells=[{row:4,col:1,properties:JSON.parse('{"__proto__":true}')}],m=>m.grid.cells=[{row:4,col:1,properties:{signal:{stateVariable:'missing'}}}],m=>m.grid.cells=[{row:4,col:1,properties:{signal:Infinity}}],m=>m.barriers=[{id:'b',row:4,col:1,passableWhen:{type:'pathClear'}}],m=>m.barriers=[{id:'b',row:4,col:1,passableWhen:{type:'all',conditions:[sensor()]}}],m=>m.entities=[entity('a',4,1,[{when:eq('flag',true),actions:[set('missing',true)]}])],m=>m.entities=[entity('a',4,1,[{when:eq('flag',true),actions:'text'}])],m=>m.conditionOptions=[{id:'a',label:'Cor?',condition:eq('color','red')}],m=>m.conditionOptions=[{id:'a',label:'Estado?',condition:eq('flag',true),values:[{value:1,label:'Sim'}]}]];
 for(const change of cases){const m=base();change(m);assert.throws(()=>validateMission(m));}
 for(const c of [{...sensor(),relativeTo:'left'},{...sensor(),property:'constructor'},{...sensor(),value:NaN},{...eq('flag',true),expression:'alert(1)'}])assert.throws(()=>validateCondition(c,base().initialVariables));
 const m=base();let effects=[set('flag',true)];for(let i=0;i<10;i++)effects=[{when:eq('flag',true),actions:effects}];m.entities=[entity('a',4,1,effects)];assert.throws(()=>validateMission(m));
 m.entities=[entity('a',4,1,Array.from({length:201},()=>set('flag',true)))];assert.throws(()=>validateMission(m));
});
test('editor filtra perguntas e valores, preserva tipos e permite igualdade numérica',()=>{
 const m=missions.find(m=>m.id===14);assert.equal(conditionOptions(m).length,1);
 assert.deepEqual(defaultCondition(m),eq('temChave',true));assert.deepEqual(configureCondition(m,'chave',{value:false}),eq('temChave',false));
 assert.throws(()=>configureCondition(m,'missing'));assert.throws(()=>configureCondition(m,'chave',{value:1}));assert.throws(()=>validateDecision({type:'pathClear'},m));
 const custom=base();custom.conditionOptions=[{id:'numero',label:'A quantidade é exata?',condition:eq('count',0)}];validateMission(custom);
 assert.deepEqual(configureCondition(custom,'numero',{value:1.5}),eq('count',1.5));
 assert.throws(()=>configureCondition(custom,'numero',{value:Infinity}));
 const ast=editProgram([],{type:'add',path:[],nodeType:'if',condition:defaultCondition(m)});assert.deepEqual(ast[0].condition,eq('temChave',true));
});
test('representação mostra pergunta, resposta, símbolos e mudanças sem termos técnicos',()=>{
 const m=missions.find(m=>m.id===14);let execution=createExecution(m,m.solution);execution=stepExecution(m,m.solution,execution);execution=stepExecution(m,m.solution,execution);
 const html=renderProgram(m.solution,m,execution,[],false);assert.match(html,/Estou com a chave\?/);assert.match(html,/>Sim</);assert.match(html,/>Não</);assert.doesNotMatch(html,/>stateEquals</);
 assert.match(eventMessages(m,execution.state).join(' '),/Estou com a chave\? Sim → ENTÃO/);assert.match(worldIndicators(m,execution.state),/Com a chave: Sim/);assert.match(describeEnvironment(m,execution.state),/Porta livre/);
 assert.equal(conditionQuestion(m,eq('temChave',false)),'Estou sem a chave?');
 const signal=missionVariants(missions.find(m=>m.id===13))[1];assert.match(renderBoard(signal,initialState(signal)),/aria-label="Sinal: Pare"/);assert.match(renderBoard(signal,initialState(signal)),/barrier closed/);
 const delivery=missions.find(m=>m.id===16);assert.match(renderBoard(delivery,initialState(delivery)),/entity delivery/);
});
for(const m of missions.filter(m=>m.id>=13))for(const variant of missionVariants(m))test(`V0.3 ${m.id}/${variant.variantId}: mesma AST, execução normal e passo a passo equivalentes`,()=>{
 const program=freeze(structuredClone(m.solution)),input=freeze(structuredClone(variant));let execution=freeze(createExecution(input,program));const states=[execution.state];
 while(!terminal(execution.state)){execution=freeze(stepExecution(input,program,execution));states.push(execution.state);}
 assert.deepEqual(states,simulate(input,program));assert.equal(states.at(-1).status,'won');
 const limited=simulate(input,program,{instructionLimit:1}).at(-1);assert.equal(limited.status,'limit');
});
