import {test} from 'node:test';
import assert from 'node:assert/strict';
import {initialState, applyCommand, simulate, validateMission, createExecution, stepExecution, terminal, evaluateCondition} from '../src/engine.js';
import {missions, missionVariants} from '../src/missions.js';
import {createSession, stepSession, canStep, startVariantTests} from '../src/session.js';
import {editProgram, sequenceAt, countNodes} from '../src/program.js';
import {renderProgram, renderBoard} from '../src/view.js';
const seq = text => text.split('').map(c => ({type:{A:'move',E:'turnLeft',D:'turnRight'}[c]}));
const conditional = (condition, then, otherwise = []) => ({type:'if', condition, then, else:otherwise});
const atLeast = (variable, value) => ({type:'stateAtLeast', variable, value});
const base = () => ({grid:{width:5,height:5,obstacles:[]},start:{row:4,col:0,direction:'L'},goal:{row:4,col:4},initialVariables:{score:0,enabled:false,label:'início'},entities:[{id:'objeto-a',row:4,col:1,collectible:true,onEnter:[{type:'increment',variable:'score',amount:3},{type:'set',variable:'enabled',value:true},{type:'set',variable:'label',value:'descoberta'}]}]});
function deepFreeze(value) { if (value && typeof value === 'object') { Object.values(value).forEach(deepFreeze); Object.freeze(value); } return value; }
function end(mission, program) { return simulate(mission, program).at(-1); }
function finishSession(session) { let guard = 0; while (canStep(session)) { assert(++guard < 2000); session = stepSession(session); } return session; }

test('coleta automática emite eventos e aplica variáveis genéricas de vários tipos', () => {
  const m = deepFreeze(base()), before = deepFreeze(initialState(m));
  const s = applyCommand(m, before, {type:'move'});
  assert.equal(s.collectedCount,1); assert.deepEqual(s.collectedIds,['objeto-a']);
  assert.deepEqual(s.variables,{score:3,enabled:true,label:'descoberta'});
  assert.deepEqual(s.events.map(e=>e.type),['moved','entityEntered','variableChanged','variableChanged','variableChanged','collected']);
  assert.equal(before.variables.score,0); assert.deepEqual(before.collectedIds,[]);
});
test('reentrar na casa ou virar sobre o objeto não coleta duas vezes', () => {
  const m = base(), s = end(m,seq('ADDADDA'));
  assert.equal(s.collectedCount,1); assert.equal(s.variables.score,3);
});
test('reiniciar cria estado independente e restaura objetos e variáveis', () => {
  const m = base(), played = applyCommand(m, initialState(m), {type:'move'}), reset = initialState(m);
  assert.equal(played.collectedCount,1); assert.equal(reset.collectedCount,0);
  assert.deepEqual(reset.collectedIds,[]); assert.equal(reset.variables.score,0); assert.equal(reset.variables.enabled,false);
  assert.match(renderBoard(m,reset),/class="entity"/); assert.doesNotMatch(renderBoard(m,played),/class="entity"/);
});
test('objeto na casa inicial só é coletado depois de sair e entrar', () => {
  const m=base();m.entities[0].col=0;
  assert.equal(initialState(m).collectedCount,0);
  assert.equal(end(m,seq('ADD A'.replaceAll(' ',''))).collectedCount,1);
});
test('várias entidades na mesma casa têm IDs e efeitos independentes', () => {
  const m=base();m.entities.push({...structuredClone(m.entities[0]),id:'objeto-b'});
  const s=end(m,seq('A'));assert.equal(s.collectedCount,2);assert.equal(s.variables.score,6);
});
test('entidade não coletável aplica ação a cada entrada sem alterar collectedIds', () => {
  const m=base();m.entities[0].collectible=false;
  const s=end(m,seq('ADDADDA'));assert.equal(s.collectedCount,0);assert.equal(s.variables.score,6);
});
test('destino incompleto permite sair, coletar e retornar; score não substitui destino', () => {
  const m=missions.find(m=>m.id===8), states=simulate(m,m.solution);
  const early=states.find(s=>s.row===m.goal.row&&s.col===m.goal.col);
  assert.equal(early.status,'running');assert.equal(early.collectedCount,1);
  assert(early.events.some(e=>e.type==='goalIncomplete'));
  assert.equal(states.at(-1).status,'won');assert.equal(states.at(-1).collectedCount,2);
  const generic=base();generic.winCondition=atLeast('score',3);
  assert.equal(end(generic,seq('A')).status,'finished');
});
test('contador genérico pode ser consultado sem vincular condição ao tipo da entidade', () => {
  const m=base(),s=applyCommand(m,initialState(m),{type:'move'});
  assert.equal(evaluateCondition(m,s,atLeast('collectedCount',1)),true);
  assert.equal(evaluateCondition(m,s,atLeast('score',3)),true);
});
test('condição consulta o estado após a coleta e executa somente ENTÃO', () => {
  const m=base(),p=[...seq('A'),conditional(atLeast('score',3),seq('AAA'),seq('AAAAA'))];
  const states=simulate(m,p);assert.equal(states.at(-1).status,'won');
  const decision=states.find(s=>s.lastEvent==='condition');
  assert.equal(decision.col,1);assert.equal(decision.events[0].result,true);assert.equal(decision.events[0].branch,'then');
});
test('condição falsa executa SENÃO; sensor considera rotação, obstáculos e bordas', () => {
  const m=base();m.grid.obstacles=[{row:3,col:0}];
  const p=[...seq('E'),conditional({type:'pathClear'},seq('A'),seq('DAAAA'))];
  const states=simulate(m,p);assert.equal(states.at(-1).status,'won');
  assert.equal(states.find(s=>s.lastEvent==='condition').events[0].result,false);
  assert.equal(evaluateCondition(m,{...initialState(m),direction:'S'},{type:'pathClear'}),false);
  assert.equal(evaluateCondition(m,initialState(m),{type:'pathClear'}),true);
});
test('ramos vazios e aninhados retornam à sequência do pai', () => {
  const m=base();const p=[conditional({type:'pathClear'},[conditional(atLeast('score',1),seq('E'),[])],seq('E')),...seq('AAAA')];
  const states=simulate(m,p);assert.equal(states.at(-1).status,'won');assert.equal(states.at(-1).instructionPointer,6);
});
test('passo a passo equivale à simulação, preserva estados e informa caminhos', () => {
  const m=missionVariants(missions.find(m=>m.id===11))[1],p=deepFreeze(structuredClone(m.solution));
  let execution=deepFreeze(createExecution(m,p));const states=[execution.state],paths=[];
  while(!terminal(execution.state)){const previous=execution;execution=stepExecution(m,p,previous);paths.push(execution.activePath);states.push(execution.state);deepFreeze(execution);}
  assert.deepEqual(states,simulate(m,p));assert(paths.some(path=>path?.includes('else')));
  assert(paths.some(path=>JSON.stringify(path)==='[0,"then",1]'));
});
test('limite conta decisões vazias e passos sem movimento e interrompe com motivo', () => {
  const m=base(),p=[conditional({type:'pathClear'},[]),...seq('DDDD')];
  const s=simulate(m,p,{instructionLimit:2}).at(-1);assert.equal(s.status,'limit');assert.equal(s.instructionPointer,2);
  assert.equal(end(m,[conditional({type:'pathClear'},[])]).status,'finished');
  assert.throws(()=>createExecution(m,[],{instructionLimit:0}));
});
test('rejeita entidades, ações, condições e AST malformadas', () => {
  for (const change of [m=>m.entities.push({...m.entities[0]}),m=>m.entities[0].row=-1,m=>m.entities[0].onEnter=[{type:'eval',variable:'score'}],m=>m.entities[0].onEnter=[{type:'increment',variable:'unknown',amount:1}],m=>m.entities[0].onEnter=[{type:'set',variable:'score',value:'texto'}],m=>m.winCondition=atLeast('unknown',1),m=>m.initialVariables.constructor=1]) {
    const m=base();change(m);assert.throws(()=>validateMission(m));
  }
  for(const p of [[{type:'while'}],[conditional(atLeast('enabled',1),[])],[{type:'if',condition:{type:'pathClear'},then:[]}],[conditional({type:'pathClear'},null)]])assert.throws(()=>createExecution(base(),p));
  let nested=[];for(let i=0;i<10;i++)nested=[conditional({type:'pathClear'},nested)];assert.throws(()=>createExecution(base(),nested));
  assert.throws(()=>createExecution(base(),Array.from({length:301},()=>({type:'move'}))));
});
for(const m of missions.filter(m=>m.id>=7))for(const variant of missionVariants(m))test(`missão ${m.id} / ${variant.variantId}: mesma solução válida, determinística e imutável`,()=>{
  const input=deepFreeze(structuredClone(variant)),p=deepFreeze(structuredClone(m.solution));
  const first=simulate(input,p);assert.equal(first.at(-1).status,'won');
  assert.deepEqual(first,simulate(input,p));
});
for(const m of missions.filter(m=>m.variants&&m.id<=21))test(`missão ${m.id}: variantes exercitam verdadeiro/falso e rejeitam fixar um ramo`,()=>{
  const scenarios=missionVariants(m),results=new Set(scenarios.flatMap(v=>simulate(v,m.solution).flatMap(s=>s.events.filter(e=>e.type==='condition').map(e=>e.result))));
  assert.deepEqual([...results].sort(),[false,true]);
  function flatten(nodes, side){return nodes.flatMap(n=>n.type==='if'?flatten(n[side],side):[n]);}
  for(const side of ['then','else'])assert(scenarios.some(v=>end(v,flatten(m.solution,side)).status!=='won'));
});
test('missão 12 diferencia pontos do número de objetos',()=>{
 const m=missions.find(m=>m.id===12),variants=missionVariants(m),ends=variants.map(v=>end(v,m.solution));
 assert.deepEqual(ends.map(s=>s.collectedCount),[1,2]);assert.deepEqual(ends.map(s=>s.variables.points),[2,2]);
});
test('sessão exige treino, testa todas as variantes com programa fixo e reset invalida resultado',()=>{
 const m=missions.find(m=>m.id===11);let s=createSession(m,m.solution);
 assert.throws(()=>startVariantTests(s));s=finishSession(s);
 assert.equal(s.completed,false);assert.deepEqual(s.passed,[0]);
 s=finishSession(startVariantTests(s));assert.equal(s.completed,true);assert.deepEqual(s.passed,[0,1,2]);
 const reset=createSession(m,m.solution);assert.deepEqual(reset.passed,[]);assert.equal(reset.execution.state.collectedCount,0);assert.equal(reset.scenarioIndex,0);
});
test('sequência que vence só treino não conclui a missão com variantes',()=>{
 const m=missions.find(m=>m.id===9),p=m.solution[0].then;
 const trained=finishSession(createSession(m,p));assert.equal(trained.execution.state.status,'won');assert.equal(trained.completed,false);
 const tested=finishSession(startVariantTests(trained));assert.equal(tested.execution.state.status,'collision');assert.equal(tested.completed,false);assert.deepEqual(tested.passed,[0]);
});
test('sessão não altera o programa capturado quando o editor muda',()=>{
 const m=missions.find(m=>m.id===9),p=structuredClone(m.solution),s=createSession(m,p);p.length=0;
 assert.equal(finishSession(s).execution.state.status,'won');assert.equal(s.program.length,1);
});
test('editor insere, reordena e remove dentro de ramos sem mutar o original',()=>{
 const original=deepFreeze([conditional({type:'pathClear'},seq('AE'),[])]);
 let next=editProgram(original,{type:'add',path:[0,'else'],nodeType:'turnRight'});
 next=editProgram(next,{type:'move',path:[0,'then',1],offset:-1});
 assert.equal(sequenceAt(next,[0,'then'])[0].type,'turnLeft');assert.equal(countNodes(next),4);
 next=editProgram(next,{type:'condition',path:[0],condition:atLeast('collectedCount',2)});
 next=editProgram(next,{type:'remove',path:[0,'then',0]});assert.equal(next[0].then.length,1);assert.equal(original[0].then.length,2);
 assert.equal(next[0].condition.value,2);assert.throws(()=>editProgram(next,{type:'move',path:[0],offset:-1}));
});
test('representação destaca condição e ramo, escapa rótulos e mostra valor da entidade',()=>{
 const m=missions.find(m=>m.id===9),execution=stepExecution(m,m.solution,createExecution(m,m.solution));
 const html=renderProgram(m.solution,m,execution,[0,'then'],false);
 assert.match(html,/aria-current="step"/);assert.match(html,/branch then executing-branch insertion-branch/);assert.match(html,/data-target="0.else"/);
 const other=missions.find(m=>m.id===12);assert.match(renderBoard(other,initialState(other)),/\+2/);
 const custom=base();custom.presentation={entityLabel:'<script>'};assert.doesNotMatch(renderBoard(custom,initialState(custom)),/<script>/);
});
// Busca no produto dos cenários: toda sequência de locomoção possível é considerada.
// Giros/ciclos repetidos levam a estados já visitados; colisões invalidam a solução.
for (const m of missions.filter(m=>m.variants&&m.id<=23)) test(`missão ${m.id}: nenhuma sequência fixa resolve todos os cenários`, () => {
  const scenarios = missionVariants(m);
  const key = states => JSON.stringify(states.map(s=>[s.row,s.col,s.direction,s.status==='won',s.variables,s.collectedIds.slice().sort()]));
  const first = scenarios.map(initialState), pending = [first], visited = new Set([key(first)]);
  for (let index=0; index<pending.length; index++) {
    assert(pending.length < 10000, 'Busca precisa de um limite maior para este mapa');
    for (const type of ['move','turnLeft','turnRight']) {
      const next = pending[index].map((s,i)=>applyCommand(scenarios[i],s,{type}));
      if (next.some(s=>s.status==='collision')) continue;
      assert(!next.every(s=>s.status==='won'), 'Existe uma solução fixa; decisão seria decorativa');
      const id=key(next);if(!visited.has(id)){visited.add(id);pending.push(next);}
    }
  }
});
