import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {missions,missionVariants} from '../src/missions.js';
import {missions as legacy} from './helpers/historical-catalog.js';
import {simulate,createExecution,stepExecution,initialState,applyCommand,validateMission,validateProgram,terminal} from '../src/engine.js';
import {createSession,stepSession,canStep,startVariantTests} from '../src/session.js';
import {serializeMission,parseMission} from '../src/mission-io.js';
import {createPlaytest,stepPlaytest,referenceValidated} from '../src/studio/playtest.js';
import {explorationEnabled,normalizeProgress,isUnlocked,PROGRESS_KEY} from '../src/progress.js';
import {gameController} from './helpers/controllers.js';
import {renderBoard} from '../src/view.js';
import {calculationLog} from '../src/calculation-view.js';
import {seq,eq,mem} from '../src/lock-mission-data.js';
const clone=structuredClone,m=id=>clone(missions.find(m=>m.id===id));
const end=(s,p=s.solution)=>simulate(s,p).at(-1);
function finish(s){let n=0;while(canStep(s)){assert(++n<10000);s=stepSession(s);}return s;}
function execute(s,p,options){let e=createExecution(s,p,options);while(!terminal(e.state))e=stepExecution(s,p,e);return e;}
function nodes(list){return list.flatMap(n=>[n,...nodes(n.then??[]),...nodes(n.else??[]),...nodes(n.body??[]),...(n.cases??[]).flatMap(c=>nodes(c.body)),...nodes(n.default??[])]);}
const text=p=>readFileSync(new URL(p,import.meta.url),'utf8');
test('V094: 32 missões, 68 cenários, IDs estáveis e 28 removida',()=>{
 assert.equal(missions.length,32);assert.equal(missions.flatMap(missionVariants).length,68);assert(!missions.some(m=>m.id===28));assert.equal(missions.at(-1).id,33);
});
for(const source of missions)test(`V094 atual ${source.id}: validação, JSON, referência única, sessões e Studio em todas variantes`,()=>{
 const before=JSON.stringify(source),copy=parseMission(serializeMission(source));assert.deepEqual(copy,source);validateMission(copy);
 for(const scenario of missionVariants(copy)){validateProgram(copy.solution,scenario);const e=execute(scenario,copy.solution);assert.equal(e.state.status,'won',`${source.id}/${scenario.variantId}: ${JSON.stringify(e.state)}`);assert.equal(e.state.row,scenario.goal.row);assert.equal(e.state.col,scenario.goal.col);assert.deepEqual(e.state,end(scenario,copy.solution));assert(e.calculationHistory.length);}
 let s=finish(createSession(copy,copy.solution));if(s.scenarios.length>1)s=finish(startVariantTests(s));assert(s.completed);assert.equal(s.executionArchives.length,s.scenarios.length-1);
 let t=createPlaytest(copy);let n=0;while(!t.done){assert(++n<10000);t=stepPlaytest(t);}assert(referenceValidated(t,copy));assert.equal(JSON.stringify(source),before);
});
test('V094: todas interações oficiais são na mesma casa; inspecionar à frente continua permitido',()=>{
 for(const source of missions)for(const scenario of missionVariants(source)){
  const interactions=(scenario.entities??[]).flatMap(e=>e.interactions??[]);if(!interactions.length)continue;
  assert.equal(scenario.interactionPolicy,'here');interactions.forEach(a=>assert.deepEqual(a.relativeTo,['here']));
  for(const node of nodes(source.solution).filter(n=>n.type==='interact')){assert.equal(node.relativeTo,'here');assert.throws(()=>validateProgram([{...node,relativeTo:'front'}],scenario));}
  for(const option of scenario.commandOptions.filter(o=>o.node.type==='interact'))assert.equal(option.node.relativeTo,'here');
 }
 const s=m(30);assert.equal(s.solution[0].source.relativeTo,'front');
 const before=initialState(s),failed=applyCommand(s,before,s.commandOptions.find(o=>o.id==='retirar').node);assert.equal(failed.status,'actionFailed');assert.deepEqual(failed.variables,before.variables);assert.deepEqual(failed.memory,before.memory);
 const old=clone(legacy.find(m=>m.id===18));assert.equal(end(old).status,'won'); // Legacy JSON retains its explicitly declared front reach.
});
test('05: somente dois comandos após a chegada foram removidos; referência antiga agora falha',()=>{
 const old=clone(legacy.find(m=>m.id===5)),current=m(5);assert.deepEqual(current.solution,old.solution.slice(0,11));assert.equal(end(current,old.solution).reason,'commandsRemaining');delete current.solution;delete old.solution;assert.deepEqual(current,old);
});
test('08 e 16: energia solicitada com custos explícitos e referências viáveis',()=>{
 assert.equal(m(8).energy.initial,9);assert.equal(end(m(8)).energySpent,7);
 const scenarios=missionVariants(m(16));assert.equal(scenarios[1].grid.obstacles.length,0);for(const s of scenarios){assert.equal(s.energy.initial,6);assert.equal(end(s).status,'won');}
});
test('14/15: rotas cercadas; segunda placa abre a ponte uma casa acima',()=>{
 for(const id of [14,15])for(const s of missionVariants(m(id)))assert(s.grid.obstacles.length>=3);
 const [lower,upper]=missionVariants(m(15));assert.deepEqual([lower.barriers[0].row,lower.barriers[0].col],[4,2]);assert(upper.barriers.some(b=>b.row===3&&b.col===2));
 const states=simulate(upper,m(15).solution);assert(states.some(s=>s.variables.ponteAlternativa));assert(states.every(s=>!s.variables.ponteAberta));assert.equal(states.at(-1).status,'won');
});
test('17: mapas iguais, vermelho inicialmente aberto e azul exige coletar pacote para abrir',()=>{
 const [red,blue]=missionVariants(m(17));assert.deepEqual(red.grid,blue.grid);assert.deepEqual(red.start,blue.start);assert.deepEqual(red.entities,blue.entities);assert.equal(red.initialVariables.ponteAberta,true);assert.equal(blue.initialVariables.ponteAberta,false);
 const states=simulate(blue,m(17).solution),firstOpen=states.findIndex(s=>s.variables.ponteAberta);assert(firstOpen>0);assert(states[firstOpen].collectedIds.includes('pacote'));assert.equal(states.at(-1).status,'won');
});
test('19: ação renomeada, autorização inicial falsa, final sem autorização e entrega negada falham',()=>{
 const s=m(19),initial=initialState(s);assert.deepEqual(initial.memory.confirmar,{known:true,value:false});assert.equal(s.commandOptions[0].label,'Obter autorização de entrega');assert.equal(end(s,[]).reason,'authorizationRequired');
 assert.equal(end(s,s.solution.slice(1)).status,'actionFailed');assert.equal(end(s,s.solution.slice(1)).variables.entregue,false);assert.equal(end(s).status,'won');assert.equal(end(s).memory.confirmar.value,true);
});
test('21: chaves sem rótulos visíveis preservam nomes acessíveis',()=>{
 for(const s of missionVariants(m(21))){for(const e of s.entities.filter(e=>e.interactions?.length))assert.equal(s.presentation.visual.entities[e.id].badge,'');assert.match(renderBoard(s,initialState(s)),/Chave vermelha/);}
});
test('23: mapa de referência, três estações, quatro códigos e metas diferentes; rota fixa não generaliza',()=>{
 const source=m(23),ss=missionVariants(source);assert.deepEqual(ss.map(s=>s.initialVariables.codigo),['A','B','C','X']);assert.deepEqual(ss.map(s=>s.goal.col),[0,2,4,4]);assert.deepEqual(source.grid.obstacles.map(p=>[p.row,p.col]),[[2,0],[2,1],[2,3],[3,3],[4,1],[4,2],[4,3]]);
 assert.deepEqual(source.entities.slice(1).map(e=>[e.row,e.col]),[[0,0],[0,2],[0,4]]);assert(!source.entities.some(e=>e.row===source.start.row&&e.col===source.start.col));
 const choice=source.solution.at(-1);assert.equal(choice.type,'switch');for(const route of [...choice.cases.map(c=>c.body),choice.default]){const fixed=[...source.solution.slice(0,-1),...route];assert(ss.some(s=>end(s,fixed).status!=='won'));}assert.equal(choice.cases.length,2);
});
test('27: sim/sim primeiro, não/não último; desvio só é passável sem nenhuma permissão',()=>{
 const ss=missionVariants(m(27));assert.deepEqual(ss.map(s=>[s.initialVariables.autorizacaoA,s.initialVariables.autorizacaoB]),[[true,true],[true,false],[false,true],[false,false]]);
 for(const [i,s]of ss.entries()){const state=initialState(s);const barrier=s.barriers.find(b=>b.id==='desvio');assert(barrier);const {row,col}=barrier;const probe={...state,row:row+1,col,direction:'N'};const next=applyCommand(s,probe,{type:'move'});assert.equal(next.status==='collision',i!==3);}
});
test('29: triagem segunda e portão terceira casa do corredor de baixo para cima',()=>{
 for(const s of missionVariants(m(29))){assert.deepEqual([s.entities[0].row,s.entities[0].col],[3,2]);assert.deepEqual([s.barriers[0].row,s.barriers[0].col],[2,2]);}
});
for(const id of [30,31,33])test(`${id}: retirar e descartar exigem presença; nenhuma sobreposição inicial; barreira depois da retirada`,()=>{
 const source=m(id);for(const s of missionVariants(source)){const states=simulate(s,source.solution);for(const state of states)for(const event of state.events.filter(e=>e.type==='interacted'&&e.success)){const e=s.entities.find(e=>e.id===event.entityId);assert.deepEqual([state.row,state.col],[e.row,e.col]);}assert.equal(states.at(-1).variables.carregando,false);assert(s.barriers.every(b=>!(b.row===s.entities[0].row&&b.col===s.entities[0].col)));}
});
function simple(){return {id:'policy-test',title:'Teste',grid:{width:5,height:5,obstacles:[]},start:{row:4,col:0,direction:'L'},goal:{row:4,col:1},initialVariables:{again:false},loopOptions:[{id:'once',kind:'for',times:1,label:'Uma vez'},{id:'twice',kind:'for',times:2,label:'Duas vezes'},{id:'until',kind:'while',condition:eq('again',false),label:'Enquanto'}]};}
test('meta com primitiva, SE ou laço pendente falha sem executar o restante',()=>{
 const s=simple();s.conditionOptions=[{id:'again',label:'De novo?',condition:eq('again',false)}];
 for(const tail of [seq('D')[0],{type:'if',condition:eq('again',false),then:[],else:[]},{type:'for',times:1,body:[]}]){const e=execute(s,[...seq('A'),tail]);assert.equal(e.state.reason,'commandsRemaining');assert.equal(e.state.instructionPointer,1);assert.equal(e.state.direction,'L');assert(!e.state.events.some(e=>e.type==='won'));}
 const e=execute(s,[{type:'for',times:2,body:seq('A')}]);assert.equal(e.state.reason,'commandsRemaining');assert.equal(e.state.col,1);
 assert.equal(execute({...s,start:{...s.start,col:1}},seq('D')).state.reason,'commandsRemaining');
});
test('checks finais falsos de laços aninhados são contabilizados antes da vitória',()=>{
 const s=simple(),p=[{type:'for',times:1,body:[{type:'for',times:1,body:seq('A')}]}],e=execute(s,p);assert.equal(e.state.status,'won');assert.equal(e.state.instructionPointer,5);assert.deepEqual(e.calculationHistory.flatMap(r=>r.events).filter(e=>e.type==='loopCheck').map(e=>e.result),[true,true,false,false]);
 assert.equal(execute(s,p,{instructionLimit:4}).state.status,'limit');
});
test('histórico completo, imutável, avaliações, resultados e arquivos de todas variantes',()=>{
 const s=simple();s.goal={row:0,col:0};s.loopOptions.push({id:'long',kind:'for',times:20,label:'Longo'});const p=[{type:'for',times:20,body:Array.from({length:100},()=>({type:'turnRight'}))}];
 let e=createExecution(s,p,{instructionLimit:3000});e=stepExecution(s,p,e);const previous=clone(e);while(!terminal(e.state))e=stepExecution(s,p,e);assert.deepEqual(previous.calculationHistory.length,1);assert.equal(e.calculationHistory.length,2021);assert.equal(e.calculationHistory[0].events[0].result,true);assert.deepEqual(previous.calculationHistory[0],e.calculationHistory[0]);
 const source=m(23);let session=finish(createSession(source,source.solution));const training=clone(session.execution.calculationHistory);session=finish(startVariantTests(session));assert(session.completed);assert.deepEqual(session.executionArchives[0].execution.calculationHistory,training);assert.equal(session.executionArchives.length,3);assert.match(calculationLog(session),/Execução 4/);assert.match(calculationLog(session),/Triagem/);assert.equal(createSession(source,source.solution).execution.calculationHistory.length,0);
});
test('querystring desbloqueia sem conceder conquistas e remoção de 28 mantém progresso por ID',async()=>{
 assert(explorationEnabled('?unlockAll=1'));for(const s of ['', '?unlockAll=0','?unlockAll=true'])assert(!explorationEnabled(s));
 const prefix=normalizeProgress(missions,legacy.slice(0,29).map(m=>m.id));assert(prefix.has(29));assert(!prefix.has(28));assert(isUnlocked(missions,prefix,30));
 const c=await gameController({search:'?unlockAll=1'});assert.doesNotMatch(c.element('#missions').innerHTML,/disabled/);c.element('#missions').onclick({target:{dataset:{mission:'33'},disabled:false,closest(){return this;}}});assert.equal(c.get().mission.id,33);assert.deepEqual(c.get().completed,[]);assert.equal(c.storage.getItem(PROGRESS_KEY),null);
});
test('UI: paleta some no playback, histórico cresce e programa não tem scroll interno',async()=>{
 const c=await gameController();c.add('move');c.add('move');c.add('move');c.element('#calculation-log').open=true;c.element('#run').onclick();assert.equal(c.element('.palette').hidden,true);assert.equal(c.element('#calculation-count').textContent,'1');assert.match(c.element('#calculation-entries').innerHTML,/Passo 1/);c.next();assert.match(c.element('#calculation-entries').innerHTML,/Passo 1/);assert.match(c.element('#calculation-entries').innerHTML,/Passo 2/);c.next();assert.equal(c.get().session.execution.state.status,'won');
 for(const path of ['../src/style.css','../src/studio/studio.css'])assert.match(text(path),/#program\{height:auto;max-height:none;overflow:visible/);
});
test('contratos opt-in validam guardas e alcances; não dependem de IDs de missão',()=>{
 for(const guard of [null,{}, {condition:mem('inexistente',true),reason:'denied'}, {condition:eq('again',false),reason:'bad reason'}, {condition:eq('again',false),reason:'denied',extra:true}])assert.throws(()=>validateMission({...simple(),completionGuard:guard}));
 const s=m(19);s.id='outro-identificador';assert.equal(end(s,[]).reason,'authorizationRequired');assert.equal(end(s).status,'won');
 s.entities[0].interactions[0].relativeTo=['front'];assert.throws(()=>validateMission(s));
});
test('catálogo mantém integralmente as missões fora das revisões de conteúdo',()=>{
 const changed=new Set([5,8,14,15,16,17,18,19,21,22,23,26,27,28,29,30,31,32,33]);for(const s of missions.filter(s=>!changed.has(s.id)))assert.deepEqual(s,legacy.find(old=>old.id===s.id),`Preservar ${s.id}`);
});
test('checks de while após a meta só aceitam encerramento falso, respeitando orçamento',()=>{
 const s=simple(),condition={type:'pathClear'};s.loopOptions.push({id:'edge',kind:'while',condition,label:'Caminho livre'});s.goal={row:4,col:4};const p=[{type:'while',condition,body:seq('A')}];const e=execute(s,p);assert.equal(e.state.status,'won');assert.equal(e.state.instructionPointer,9);assert.equal(e.calculationHistory.at(-1).events[0].result,false);assert.equal(execute(s,p,{instructionLimit:8}).state.status,'limit');
 s.goal={row:4,col:1};assert.equal(execute(s,p).state.reason,'commandsRemaining');
});

test('32: conteúdo preservado com política de interação na mesma casa',()=>{const current=m(32);delete current.interactionPolicy;assert.deepEqual(current,legacy.find(s=>s.id===32));});
test('Studio: novas missões e novos comandos começam com interação aqui; histórico não fica obsoleto após editar',async()=>{
 const {newMission}=await import('../src/studio/model.js'),{missionSchema,defaultValue}=await import('../src/studio/authoring-schema.js'),{studioController}=await import('./helpers/controllers.js');
 assert.equal(newMission().interactionPolicy,'here');assert.equal(defaultValue(missionSchema.fields.commandOptions.item.fields.node,'interact').relativeTo,'here');
 const c=studioController();for(let i=0;i<3;i++)c.click({solutionAdd:'move'});c.element('#instruction-limit').value=1000;c.element('#calculation-log').open=true;c.element('#test-all').onclick();assert.equal(c.element('#program-tools').hidden,true);c.element('#pause').onclick();while(!c.app.getTest().done)c.element('#step').onclick();assert.match(c.element('#calculation-entries').innerHTML,/Passo 1/);c.change({value:'["hint"]',kind:'string'},'Editar');assert.equal(c.element('#calculation-count').textContent,'0');assert.equal(c.element('#calculation-entries').innerHTML,'');
});
test('30: jogar à frente da lixeira falha sem descartar ou perder a caixa',()=>{
 const s=m(30),state={...initialState(s),row:2,col:2,direction:'S'};state.variables.carregando=true;const before=clone(state),command=s.commandOptions.find(o=>o.id==='descartar').node,failed=applyCommand(s,state,command);assert.equal(failed.reason,'outOfReach');assert.deepEqual(failed.variables,before.variables);assert.equal(failed.row,2);const onBin={...state,row:3};const success=applyCommand(s,onBin,command);assert.equal(success.variables.carregando,false);assert.equal(success.variables.descartadas,before.variables.descartadas+1);
});
test('23: OUTRO VALOR aceita código adicional sem editar a AST',()=>{
 const source=m(23),scenario=missionVariants(source)[2];scenario.initialVariables.codigo='Z';assert.equal(end(scenario,source.solution).status,'won');
});
test('23: entrega na estação incorreta falha atomicamente, inclusive A/B na Triagem',()=>{
 const source=m(23);for(const s of missionVariants(source)){let state=applyCommand(s,initialState(s),source.solution[0]);state=applyCommand(s,state,source.solution[1]);assert(state.variables.carregando);const expected=['A','B'].includes(s.initialVariables.codigo)?s.initialVariables.codigo:'Triagem';
  for(const station of source.entities.slice(1)){const name=station.id.slice('estacao'.length);if(name===expected)continue;const here={...state,row:station.row,col:station.col};const failed=applyCommand(s,here,{type:'interact',relativeTo:'here',entityId:station.id,actionId:'entregar'});assert.equal(failed.reason,'preconditionFailed',`${s.variantId} em ${name}`);assert.deepEqual(failed.variables,state.variables);}
 }
});
test('exemplos V094 documentados correspondem ao catálogo e vencem todas as variantes',()=>{
 for(const[id,file]of[[30,'boxes-for'],[31,'boxes-while'],[23,'package']]){const example=parseMission(text(`../docs/V094-${file}-example.json`));assert.deepEqual(example,m(id));for(const s of missionVariants(example))assert.equal(end(s,example.solution).status,'won');}
});
