import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {runInThisContext} from 'node:vm';
import {createExecution,stepExecution,simulate,interruptExecution,terminal,classifyResult} from '../src/engine.js';
import {createSession,stepSession,canStep,startVariantTests,interruptSession,canInterruptSession} from '../src/session.js';
import {semanticSignature,MAX_WHILE_HISTORY,stalledMessage,stoppedMessage} from '../src/loops.js';
import {missions,missionVariants} from '../src/missions.js';
import {renderLoopTrace} from '../src/loop-view.js';
import {commandMessages,resultLabel} from '../src/command-view.js';
const move={type:'move'},left={type:'turnLeft'},right={type:'turnRight'},condition={type:'stateEquals',variable:'open',value:true};
const loop=(body=[])=>({type:'while',condition,body});
const repeat=body=>({type:'for',times:4,body});
const freeze=value=>{if(value&&typeof value==='object'){Object.values(value).forEach(freeze);Object.freeze(value);}return value;};
function base(){return {id:'synthetic',title:'Teste',instructions:'Teste',hint:'Teste',grid:{width:5,height:5,obstacles:[]},start:{row:4,col:0,direction:'L'},goal:{row:0,col:4},initialVariables:{open:true,count:0},loopOptions:[{id:'open',kind:'while',label:'Aberta?',condition},{id:'four',kind:'for',label:'Quatro vezes',times:4}]};}
function finish(s){while(canStep(s))s=stepSession(s);return s;}
function stepped(m,p,options){let e=freeze(createExecution(m,p,options));const states=[e.state];while(!terminal(e.state)){e=freeze(stepExecution(m,p,e));states.push(e.state);}assert.deepEqual(states,simulate(m,p,options));return {e,states};}
function counter(){const m=base(),act={type:'interact',entityId:'station',relativeTo:'here',actionId:'count'};m.entities=[{id:'station',row:4,col:0,collectible:false,onEnter:[],interactions:[{id:'count',relativeTo:['here'],effects:[{type:'increment',variable:'count',amount:1}]}]}];m.commandOptions=[{id:'count',label:'Contar',node:act}];return {m,act};}
function semantic(state){return JSON.parse(semanticSignature(state));}
for(const [body,steps,completed] of [[[],2,1],[[left,right],4,1],[[right],9,4]])test(`ciclo determinístico: corpo ${body.length}, ${completed} iterações`,()=>{
 const m=base(),p=[loop(body),move],{e,states}=stepped(m,p);assert.equal(e.state.status,'stalled');assert.equal(e.state.reason,'noProgress');assert.equal(e.state.instructionPointer,steps);assert.equal(classifyResult(e.state),'failure');assert.equal(e.frames.length,0);
 assert.deepEqual(e.state.events,[{type:'loopStalled',reason:'noProgress',loop:{loopType:'while',path:[0],iteration:completed+1,completed}}]);assert.deepEqual(semantic(e.state),semantic(states.at(-2)));assert.equal(e.state.col,0);assert.equal(stepExecution(m,p,e),e);
 assert.match(renderLoopTrace(m,e,p),/preso repetindo/);assert.deepEqual(commandMessages(m,e.state),[stalledMessage]);
});
test('assinatura inclui cada fonte semântica, ignora metadados e normaliza chaves',()=>{
 const s=createExecution(base(),[]).state,key=semanticSignature(s);
 for(const patch of [{row:3},{col:1},{direction:'N'},{variables:{open:true,count:1}},{memory:{x:{known:true,value:0}}},{memory:{x:{known:false,value:null}}},{collectedCount:1},{collectedIds:['a']},{consumedIds:['a']},{usedInteractions:['a']}])assert.notEqual(semanticSignature({...s,...patch}),key);
 assert.equal(semanticSignature({...s,variables:{count:0,open:true},status:'running',instructionPointer:99,lastEvent:'x',events:[{type:'x'}]}),key);
});
test('condição falsa e orçamento têm prioridade sobre histórico; erro mantém tipo',()=>{
 const m=base(),p=[loop()];let e=stepExecution(m,p,createExecution(m,p));
 const falseState={...e,state:{...e.state,variables:{...e.state.variables,open:false}}};assert.equal(stepExecution(m,p,falseState).state.status,'finished');
 assert.equal(stepped(m,p,{instructionLimit:1}).e.state.status,'limit');assert.equal(stepped(m,p,{instructionLimit:2}).e.state.status,'stalled');
 const n=base();n.robotMemory={flag:{type:'boolean',initial:null}};const c={type:'memoryEquals',variable:'flag',value:true};n.loopOptions=[{id:'flag',label:'Sei?',kind:'while',condition:c}];const failure=stepped(n,[{type:'while',condition:c,body:[]}]).e.state;assert.equal(failure.status,'actionFailed');assert.equal(failure.reason,'memoryUnknown');assert.equal(failure.instructionPointer,1);
});
test('histórico FIFO é limitado, imutável e não interrompe progresso acima de 256',()=>{
 const {m,act}=counter(),p=[loop([act])];let e=freeze(createExecution(m,p,{instructionLimit:1100}));
 for(let i=0;i<1100;i++){const before=e,old=structuredClone(before.frames);e=freeze(stepExecution(m,p,e));assert.deepEqual(before.frames,old);for(const f of e.frames)if(f.history)assert(f.history.length<=MAX_WHILE_HISTORY);}
 assert.equal(e.state.status,'running');assert.equal(e.state.variables.count,550);assert.equal(e.frames.at(-1).history.length,256);assert.equal(stepExecution(m,p,e).state.status,'limit');
 assert.equal(createExecution(m,p).frames.length,1);assert.equal(m.initialVariables.count,0);
});
test('histórico é por ativação, inclusive reentrada no mesmo caminho em for/if/switch',()=>{
 const {m,act}=counter();const c={type:'numberCompare',left:{kind:'worldVariable',name:'count'},operator:'lt',right:{kind:'literal',value:1}};
 const reset={type:'interact',entityId:'station',relativeTo:'here',actionId:'reset'};m.entities[0].interactions.push({id:'reset',relativeTo:['here'],effects:[{type:'set',variable:'count',value:0}]});m.commandOptions.push({id:'reset',label:'Zerar',node:reset});m.loopOptions.push({id:'once',label:'Falta um?',kind:'while',condition:c});
 const w={type:'while',condition:c,body:[act]};m.switchOptions=[{id:'count',label:'Contador',selector:{kind:'worldVariable',name:'count'},cases:[{value:0,label:'Zero'},{value:1,label:'Um'}]}];
 const choice={type:'switch',selector:{kind:'worldVariable',name:'count'},cases:[{value:0,body:[w]},{value:1,body:[]}],default:[]};
 const p=[repeat([{type:'if',condition:{type:'pathClear'},then:[choice],else:[]},reset])];const {e,states}=stepped(m,p);assert.equal(e.state.status,'finished');assert.equal(states.flatMap(s=>s.events).filter(e=>e.type==='loopCheck'&&e.loopType==='while'&&e.result).length,4);
});
test('while interno não confunde contador transitório de for externo com progresso',()=>{
 const m=base(),p=[repeat([loop([repeat([])])])],{e}=stepped(m,p);assert.equal(e.state.status,'stalled');assert.deepEqual(e.state.events[0].loop.path,[0,'body',0]);assert.equal(e.state.events[0].loop.completed,1);
});
for(const structure of ['move','for','while','if','switch'])test(`interromper após passo em ${structure} preserva estado e não conta instrução`,()=>{
 const m=base();m.switchOptions=[{id:'count',label:'Contador',selector:{kind:'worldVariable',name:'count'},cases:[{value:0,label:'Zero'},{value:1,label:'Um'}]}];
 const node=structure==='move'?move:structure==='for'?repeat([move]):structure==='while'?loop([move]):structure==='if'?{type:'if',condition:{type:'pathClear'},then:[move],else:[]}:{type:'switch',selector:{kind:'worldVariable',name:'count'},cases:[{value:0,body:[move]},{value:1,body:[]}],default:[]};
 const p=[node,move],before=freeze(stepExecution(m,p,createExecution(m,p))),stopped=interruptExecution(before);
 assert.equal(stopped.state.status,'stopped');assert.equal(stopped.state.reason,'userStopped');assert.equal(classifyResult(stopped.state),'interrupted');assert(terminal(stopped.state));assert.deepEqual(semantic(stopped.state),semantic(before.state));assert.equal(stopped.state.instructionPointer,before.state.instructionPointer);assert.deepEqual(stopped.activePath,before.activePath);assert.equal(stopped.frames.length,0);assert.equal(interruptExecution(stopped),stopped);assert.equal(stepExecution(m,p,stopped),stopped);
 assert.equal(stopped.state.events[0].type,'userStopped');if(['for','while'].includes(structure))assert.equal(stopped.state.events[0].loop.loopType,structure);
});
for(const status of ['ready','won','collision','stalled','actionFailed','limit','finished','stopped'])test(`interrupção idempotente em ${status}`,()=>{
 const e=freeze({...createExecution(base(),[]),state:{...createExecution(base(),[]).state,status}});assert.equal(interruptExecution(e),e);
});
test('interrupção não aplica coleta, inspeção ou interação pendente; reset restaura tudo',()=>{
 const m=base();m.entities=[{id:'item',row:4,col:1,collectible:true,onEnter:[{type:'increment',variable:'count',amount:2}]}];const p=[right,left,move];let s=createSession(m,p);assert.equal(canInterruptSession(s),false);s=stepSession(s);s=stepSession(s);const before=freeze(s),stopped=interruptSession(before);
 assert.deepEqual(semantic(stopped.execution.state),semantic(before.execution.state));assert.equal(stopped.execution.state.collectedCount,0);assert.equal(stopped.execution.state.variables.count,0);assert.equal(canStep(stopped),false);assert.equal(stepSession(stopped),stopped);assert.equal(stopped.completed,false);assert.equal(interruptSession(stopped),stopped);assert.deepEqual(stopped.program,p);
 const reset=createSession(m,stopped.program);assert.equal(reset.execution.state.status,'ready');assert.equal(reset.execution.state.instructionPointer,0);assert.deepEqual(reset.execution.frames,[{path:[],index:0}]);
});
test('interromper variantes correntes ou avanço entre vitórias conserva passed',()=>{
 const m=structuredClone(missions.find(m=>m.id===25));m.variants.push({...structuredClone(m.variants[1]),id:'terceiro'});let s=finish(createSession(m,m.solution));s=startVariantTests(s);
 const inSecond=interruptSession(stepSession(s));assert.deepEqual(inSecond.passed,[0]);assert.equal(inSecond.completed,false);assert.equal(inSecond.scenarioIndex,1);assert.equal(canStep(inSecond),false);
 while(s.execution.state.status!=='won')s=stepSession(s);
 const won=freeze(s),between=interruptSession(won);assert.equal(between.execution,won.execution);assert.equal(between.execution.state.status,'won');assert.deepEqual(between.passed,[0,1]);assert.equal(between.interrupted,true);assert.equal(between.testing,false);assert.equal(canStep(between),false);assert.equal(stepSession(between),between);assert.equal(between.completed,false);assert.throws(()=>startVariantTests(between));
 const third=interruptSession(stepSession(stepSession(won)));assert.deepEqual(third.passed,[0,1]);assert.equal(third.scenarioIndex,2);assert.equal(third.completed,false);
});
// Executa o controlador UI real com DOM mínimo e relógio controlado. Não simula layout.
async function controller(m=missions[0],p=m.solution) {
 const source=await readFile(new URL('../src/ui.js',import.meta.url),'utf8'),bindings={};
 for(const match of source.matchAll(/^import \{([^}]+)\} from '([^']+)';$/gm)) {
  const module=await import(new URL(match[2],new URL('../src/ui.js',import.meta.url)));
  for(const name of match[1].split(',').map(name=>name.trim()))bindings[name]=module[name];
 }
 const elements=new Map(),pending=new Map();let id=0;
 const element=selector=>{
  if(!elements.has(selector))elements.set(selector,{innerHTML:'',textContent:'',dataset:{},style:{setProperty(){}},scrollTop:0,scrollLeft:0,hidden:false,disabled:false,setAttribute(name,value){this[name]=value;},focus(){},getBoundingClientRect(){return {top:0,bottom:1000};}});
  return elements.get(selector);
 };
 const environment={...bindings,structuredClone,fixtureMission:m,fixtureProgram:p,matchMedia:()=>({matches:true}),window:{confirm:()=>false},document:{activeElement:null,querySelector:selector=>selector.includes(' ')?null:element(selector),querySelectorAll:()=>[]},setTimeout:callback=>{const key=++id;pending.set(key,callback);return key;},clearTimeout:key=>pending.delete(key)};
 const names=Object.keys(environment);
 // Mesmo realm do motor: mantém as verificações estritas de protótipo JSON intactas.
 const start=runInThisContext(`(function(${names.join(',')}){${source.replace(/^import .*;\n/gm,'')};return {configure(){mission=fixtureMission;program=structuredClone(fixtureProgram);session=createSession(mission,program);render();},read(){return session;},selection(){return JSON.stringify(target);}};})`);
 const ui=start(...Object.values(environment));ui.configure();
 return {element,pending,selection:ui.selection,snapshot:()=>structuredClone(ui.read()),next(){const [key,callback]=pending.entries().next().value??[];if(callback){pending.delete(key);callback();}}};
}
test('UI: interromper cancela timer síncrono e callback antigo não retoma nem execução nova',async()=>{
 const c=await controller();assert.equal(c.element('#stop').hidden,true);c.element('#run').onclick();assert.equal(c.pending.size,1);assert.equal(c.element('#stop').hidden,false);
 const stale=[...c.pending.values()][0],before=c.snapshot();c.element('#stop').onclick();assert.equal(c.pending.size,0);assert.equal(c.snapshot().execution.state.status,'stopped');assert.equal(c.snapshot().execution.state.instructionPointer,before.execution.state.instructionPointer);assert.deepEqual(semantic(c.snapshot().execution.state),semantic(before.execution.state));
 assert.equal(c.element('#feedback').className,'stopped');assert.equal(c.element('#feedback').dataset.result,'interrupted');assert.equal(c.element('#feedback').textContent,stoppedMessage);assert.equal(c.element('#outcome-label').textContent,'Interrompido por você');assert.equal(c.element('#pause').disabled,true);assert.equal(c.element('#step').disabled,true);assert.equal(c.element('#test-variants').disabled,true);
 stale();assert.equal(c.pending.size,0);assert.equal(c.snapshot().execution.state.status,'stopped');c.element('#run').onclick();const restarted=c.snapshot();assert.equal(restarted.execution.state.instructionPointer,1);stale();assert.deepEqual(c.snapshot(),restarted);assert.equal(c.pending.size,1);
 c.element('#reset').onclick();assert.equal(c.pending.size,0);assert.equal(c.snapshot().execution.state.status,'ready');assert.deepEqual(c.snapshot().program,before.program);
});
test('UI: pausar e passo manual continuam interrompíveis, sem trocar seleção ou AST',async()=>{
 const c=await controller(missions.find(m=>m.id===24));c.element('#run').onclick();c.next();c.element('#pause').onclick();assert.equal(c.pending.size,0);assert.equal(c.snapshot().execution.state.status,'running');assert.equal(c.element('#stop').disabled,false);
 c.element('#step').onclick();const paused=c.snapshot(),selection=c.selection();c.element('#stop').onclick();assert.equal(c.snapshot().execution.state.status,'stopped');assert.deepEqual(c.snapshot().program,paused.program);assert.equal(c.selection(),selection);assert.equal(c.pending.size,0);c.element('#pause').onclick();assert.equal(c.pending.size,0);
 const manual=await controller();manual.element('#step').onclick();manual.element('#stop').onclick();assert.equal(manual.snapshot().execution.state.status,'stopped');assert.equal(manual.snapshot().execution.state.instructionPointer,1);
});
test('UI: interrupção no intervalo de variantes mantém vitórias e cancela avanço agendado',async()=>{
 const m=structuredClone(missions.find(m=>m.id===25));m.variants.push({...structuredClone(m.variants[1]),id:'terceiro'});const c=await controller(m);c.element('#run').onclick();while(c.pending.size)c.next();c.element('#test-variants').onclick();
 while(c.snapshot().scenarioIndex===1&&c.snapshot().execution.state.status!=='won')c.next();
 assert.deepEqual(c.snapshot().passed,[0,1]);assert.equal(c.pending.size,1);const stale=[...c.pending.values()][0];c.element('#stop').onclick();assert.equal(c.pending.size,0);stale();assert.equal(c.snapshot().scenarioIndex,1);assert.equal(c.snapshot().execution.state.status,'won');assert.deepEqual(c.snapshot().passed,[0,1]);assert.equal(c.snapshot().completed,false);assert.equal(c.element('#outcome-label').textContent,'Interrompido por você');assert.equal(c.element('#feedback').className,'stopped');
});
test('UI: estagnação termina automaticamente sem timer vivo, com mensagem única e falha',async()=>{
 const c=await controller(base(),[loop()]);c.element('#run').onclick();c.next();assert.equal(c.snapshot().execution.state.status,'stalled');assert.equal(c.pending.size,0);assert.equal(c.element('#feedback').textContent,stalledMessage);assert.equal(c.element('#feedback').dataset.result,'failure');assert.equal(c.element('#pause').disabled,true);assert.equal(c.element('#step').disabled,true);assert.equal(c.element('#stop').hidden,true);assert.match(c.element('#loop-trace').innerHTML,/preso repetindo/);
});
test('controle acessível e estados adicionados preservam classificação anterior',async()=>{
 assert.equal(resultLabel('interrupted'),'Interrompido por você');
 for(const [status,result] of [['won','success'],['finished','incomplete'],['limit','failure'],['collision','failure'],['actionFailed','failure'],['stalled','failure'],['stopped','interrupted']]){assert.equal(classifyResult({status}),result);assert(terminal({status}));}
 const html=await readFile(new URL('../index.html',import.meta.url),'utf8'),css=await readFile(new URL('../src/style.css',import.meta.url),'utf8');assert.match(html,/<button id="stop" hidden disabled>■ Interromper<\/button>/);assert.match(css,/#stop\{min-width:44px;min-height:44px\}/);
});
for(const m of missions)for(const scenario of missionVariants(m))test(`regressão V0.7.1: ${m.id}/${scenario.variantId}`,()=>{
 const {e}=stepped(freeze(scenario),freeze(structuredClone(m.solution)));assert.equal(e.state.status,'won');assert.equal(interruptExecution(e),e);
});
test('ciclo maior que janela FIFO usa o limite global, sem heurística de overflow',()=>{
 const {m,act}=counter(),reset={type:'interact',entityId:'station',relativeTo:'here',actionId:'reset'};
 m.entities[0].interactions.push({id:'reset',relativeTo:['here'],effects:[{type:'set',variable:'count',value:0}]});m.commandOptions.push({id:'reset',label:'Zerar',node:reset});
 const condition={type:'stateAtLeast',variable:'count',value:257};m.conditionOptions=[{id:'reset',label:'Completou 257?',condition}];
 const p=[loop([act,{type:'if',condition,then:[reset],else:[]}])],{e}=stepped(m,p,{instructionLimit:2000});assert.equal(e.state.status,'limit');assert.equal(e.state.instructionPointer,2000);
});
for(const type of ['setMemory','inspect'])test(`memória alterada por ${type} diferencia estado antes de detectar repetição`,()=>{
 const m=base();m.robotMemory={observed:{type:'boolean',initial:null}};m.grid.cells=[{row:4,col:1,properties:{flag:false}}];
 const node=type==='setMemory'?{type:'setMemory',variable:'observed',value:false}:{type:'inspect',source:{type:'cellProperty',relativeTo:'front',property:'flag'},into:'observed'};m.commandOptions=[{id:'read',label:'Observar',node}];
 const {e}=stepped(m,[loop([node])]);assert.equal(e.state.status,'stalled');assert.equal(e.state.instructionPointer,5);assert.equal(e.state.events[0].loop.completed,2);assert.deepEqual(e.state.memory.observed,{known:true,value:false});
});
test('uso único sem outra mudança progride no histórico e preserva falha alreadyUsed',()=>{
 const m=base(),node={type:'interact',relativeTo:'here',entityId:'once',actionId:'use'};m.entities=[{id:'once',row:4,col:0,collectible:false,onEnter:[],interactions:[{id:'use',relativeTo:['here'],once:true,effects:[]}]}];m.commandOptions=[{id:'use',label:'Usar',node}];
 const {e}=stepped(m,[loop([node])]);assert.equal(e.state.status,'actionFailed');assert.equal(e.state.reason,'alreadyUsed');assert.equal(e.state.instructionPointer,4);
});
