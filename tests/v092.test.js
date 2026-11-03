import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {missions,missionVariants} from './helpers/historical-catalog.js';
import {simulate,createExecution,stepExecution,initialState,applyCommand,validateMission,validateProgram,interruptExecution} from '../src/engine.js';
import {createSession,stepSession,canStep,startVariantTests} from '../src/session.js';
import {loopPermissions,createLoop,canonical} from '../src/loops.js';
import {serializeMission,parseMission,serializeDraft,parseDraft} from '../src/mission-io.js';
import {loadImportedGame} from '../src/imported-game.js';
import {createPlaytest,stepPlaytest,referenceValidated} from '../src/studio/playtest.js';
import {renderLoopPalette,loopTitle,renderLoopTrace} from '../src/loop-view.js';
import {renderSceneBoard} from '../src/presentation/scene-view.js';
import {resolveScene} from '../src/presentation/visual-resolver.js';
import {studioController,gameController} from './helpers/historical-controllers.js';
import {seq} from '../src/lock-mission-data.js';
import {removeBox,discardBox,transportCycle,inspectBoxes,observedCount} from '../src/demo-missions-v092.js';
const clone=structuredClone;
const mission=id=>clone(missions.find(m=>m.id===id));
const end=(m,p=m.solution)=>simulate(m,p).at(-1);
const scenarios=id=>missionVariants(mission(id));
const withoutVisual=x=>Array.isArray(x)?x.map(withoutVisual):x&&typeof x==='object'?Object.fromEntries(Object.entries(x).filter(([k])=>k!=='presentation').map(([k,v])=>[k,withoutVisual(v)])):x;
const hash=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex');
const baseline=JSON.parse(readFileSync(new URL('./fixtures/v091-curriculum-baseline.json',import.meta.url)));
const finishSession=s=>{let steps=0;while(canStep(s)){assert(++steps<2000);s=stepSession(s);}return s;};
const finishTest=t=>{let steps=0;while(!t.done){assert(++steps<10000);t=stepPlaytest(t);}return t;};
const events=states=>states.flatMap(s=>s.events);
const freeze=o=>{if(o&&typeof o==='object'){Object.values(o).forEach(freeze);Object.freeze(o);}return o;};
for(const old of baseline.missions.filter(m=>![20,21,22,24].includes(m.id)))test(`V092 preserva definição e traces V091 da ${old.id}`,()=>{
 const current=mission(old.id);assert.equal(hash(withoutVisual(current)),hash(withoutVisual(old)));const before=missionVariants(old);for(const [i,s]of missionVariants(current).entries())assert.deepEqual(simulate(s,current.solution),simulate(before[i],old.solution));
});
test('catálogo: 33 missões / 71 cenários, 27 novos; AST única não mutada',()=>{
 assert.equal(missions.length,33);assert.equal(new Set(missions.map(m=>m.id)).size,33);assert.deepEqual(missions.map(m=>m.id),Array.from({length:33},(_,i)=>i+1));assert.equal(missions.reduce((n,m)=>n+missionVariants(m).length,0),71);
 for(const [id,count]of [[26,4],[27,4],[28,4],[29,4],[30,3],[31,4],[32,2],[33,2]]){const m=freeze(mission(id));assert.equal(missionVariants(m).length,count);const original=canonical(m.solution);for(const s of missionVariants(m)){validateMission(s);validateProgram(m.solution,s);assert.equal(end(freeze(s),m.solution).status,'won');}assert.equal(canonical(m.solution),original);}
});
test('20: somente inspeção removida; mapas, física, variantes, solução e falhas iguais',()=>{
 const old=clone(baseline.missions.find(m=>m.id===20));delete old.commandOptions;delete old.robotMemory;delete old.presentation.memory;old.hint=mission(20).hint;assert.deepEqual(withoutVisual(mission(20)),withoutVisual(old));
 for(const [i,s]of scenarios(20).entries()){assert.equal(end(s).status,'won');assert.equal(end(s,seq('AEADAADAEA')).status,i?'collision':'won');assert.equal(end(s,seq('ADAEAAEADA')).status,i?'won':'collision');assert.throws(()=>validateProgram([baseline.missions[19].commandOptions[0].node],s));}
});
for(const id of [21,22])test(`${id}: porta observada à frente antes de alcançar chaves, três variantes`,()=>{
 const m=mission(id);assert.deepEqual(m.start,{row:2,col:0,direction:'L'});assert.deepEqual(m.goal,{row:2,col:4});assert(!m.grid.obstacles.some(p=>p.row===2&&p.col===3));assert(m.grid.obstacles.some(p=>p.row===1&&p.col===2));assert.equal(m.entities.filter(e=>e.id.startsWith('opcao')).every(e=>e.row===0&&e.col===2),true);
 const inspect=m.commandOptions[0].node;assert.equal(inspect.source.type,'barrierProperty');assert.equal(applyCommand(m,initialState(m),inspect).reason,'outOfReach');
 for(const s of missionVariants(m)){
  const states=simulate(s,m.solution),observed=states.find(st=>st.lastEvent==='inspected');assert.deepEqual([observed.row,observed.col,observed.direction],[2,1,'L']);assert.equal(observed.events[0].barrierId,'passagem');assert.equal(states.at(-1).status,'won');assert.equal(states.at(-1).variables.escolhida,s.initialVariables.cor);
  const noInspect=m.solution.filter(n=>n.type!=='inspect');assert.equal(end(s,noInspect).reason,'memoryUnknown');assert.equal(end(s,seq('AAAA')).status,'collision');
  const correctPrefix=m.solution.slice(0,id===21?6:6);const wrong=m.commandOptions.find(o=>o.node.type==='interact'&&o.node.entityId!==`opcao-${s.initialVariables.cor}`).node;const failed=end(s,[...correctPrefix,wrong]);assert.equal(failed.reason,'preconditionFailed');assert.deepEqual(failed.consumedIds,[]);assert.equal(failed.variables.liberada,false);
 }
 // Bloquear (2,1) desconecta início e chaves na geometria, sem buscar solução energética.
 assert.equal(connected(m,[{row:2,col:1}],{row:0,col:2}),false);
});
function connected(m,blocked,goal=m.goal){const seen=new Set(),queue=[[m.start.row,m.start.col]],rocks=[...m.grid.obstacles,...blocked];for(let i=0;i<queue.length;i++){const [row,col]=queue[i],key=`${row},${col}`;if(seen.has(key))continue;seen.add(key);if(row===goal.row&&col===goal.col)return true;for(const [dr,dc]of [[1,0],[-1,0],[0,1],[0,-1]]){const r=row+dr,c=col+dc;if(r>=0&&c>=0&&r<m.grid.height&&c<m.grid.width&&!rocks.some(p=>p.row===r&&p.col===c)&&!seen.has(`${r},${c}`))queue.push([r,c]);}}return false;}
test('26: cor e forma independentes; escolhas erradas e qualquer inspeção omitida falham',()=>{
 const m=mission(26);assert.equal(m.conditionOptions.some(o=>o.condition.type==='all'),false);
 for(const s of missionVariants(m)){assert.equal(end(s).status,'won');for(const name of ['corNecessaria','formaNecessaria'])assert.equal(end(s,m.solution.filter(n=>n.type!=='inspect'||n.into!==name)).reason,'memoryUnknown');
  const prefix=m.solution.slice(0,7),correct=`chave-${s.initialVariables.cor}-${s.initialVariables.forma}`;
  for(const o of m.commandOptions.filter(o=>o.node.type==='interact'&&o.node.entityId!==correct)){const st=end(s,[...prefix,o.node]);assert.equal(st.reason,'preconditionFailed');assert.equal(st.variables.liberada,false);}
 }
 const artwork=resolveScene(m,initialState(m)).entities.map(e=>e.asset.id);assert.equal(new Set(artwork).size,4);for(const e of resolveScene(m,initialState(m)).entities){const svg=readFileSync(new URL('../src/assets/'+e.asset.file,import.meta.url),'utf8');assert.match(svg,/fill="#fff8e8"/);if(e.properties.forma==='redonda')assert.match(svg,/<circle cx="21" cy="21" r="15"/);else assert.match(svg,/<rect x="7" y="7" width="28" height="28"/);}
});
test('27: OU inclusivo cobre tabela verdade, curto-circuito e ramos necessários',()=>{
 const m=mission(27),ss=missionVariants(m);for(const s of ss)assert.equal(end(s).status,'won');const both=events(simulate(ss[3],m.solution)).filter(e=>e.type==='condition');assert.equal(both.length,1);assert.equal(both[0].condition.variable,'autorizacaoA');
 const noA=clone(m.solution);noA[0].then=seq('AAA');assert.equal(end(ss[1],noA).status,'collision');const noB=clone(m.solution);noB[0].else[0].then=seq('AAA');assert.equal(end(ss[2],noB).status,'collision');
 assert.equal(end(ss[0],seq('EADAADAEA')).status,'won');assert.equal(end(ss[1],seq('EADAADAEA')).reason,'reserved');assert.equal(end(ss[0],[...m.solution[0].then]).status,'actionFailed');
});
test('28/29: casos reais, zero conhecido, aninhamento, ações erradas e casos vazios falham',()=>{
 for(const id of [28,29]){const m=mission(id),ss=missionVariants(m);for(const s of ss){const trace=events(simulate(s,m.solution)).filter(e=>e.type==='switch');assert.equal(trace.length,id===28?1:2);assert.equal(end(s).status,'won');}
 const bad=clone(m.solution);if(id===28)bad[0].cases[0].body=[];else bad[0].cases[0].body[0].cases[0].body=[];assert.equal(end(ss[0],bad).status,'collision');
 const wrong=m.commandOptions.at(-1).node;assert.equal(end(ss[0],[wrong,...seq('AAAA')]).reason,'preconditionFailed');assert.equal(end(ss.at(-1),[wrong,...seq('AAAA')]).status,'won');}
 assert.equal(events(simulate(scenarios(28)[0],mission(28).solution)).find(e=>e.type==='switch').value,0);
});
for(const id of [30,31,33])test(`${id}: pilha bloqueia, retirada e descarte atômicos, variantes isoladas`,()=>{
 const m=mission(id);for(const s of missionVariants(m)){
 const n=s.initialVariables.restantes,st=end(s);assert.equal(st.status,'won');assert.deepEqual(st.variables,{restantes:0,carregando:false,descartadas:n});assert.equal(events(simulate(s,m.solution)).filter(e=>e.type==='interacted').length,2*n);assert.equal(connected(s,[{row:2,col:2}]),false);
 if(n){assert.equal(end(s,seq('A')).reason,'stackBlocked');const fail=end(s,[removeBox,removeBox]);assert.equal(fail.reason,'preconditionFailed');assert.equal(fail.variables.restantes,n-1);assert.equal(fail.variables.carregando,true);assert.equal(fail.variables.descartadas,0);}
 const bad=end(s,[discardBox]);assert.equal(bad.reason,'outOfReach');assert.deepEqual(bad.variables,s.initialVariables);if(s.energy)assert.equal(bad.energySpent,0);
 assert.deepEqual(initialState(s).variables,s.initialVariables);const scene=resolveScene(s,initialState(s));assert.equal(scene.entities.find(e=>e.id==='pilha').quantity,n);assert.equal(resolveScene(s,st).entities.find(e=>e.id==='pilha').quantity,0);assert.equal(resolveScene(s,st).entities.find(e=>e.id==='lixeira').quantity,n);assert.match(renderSceneBoard(s,st),new RegExp(`Lixeira: ${n}`));
 }
});
test('30: inspeção essencial; contagem literal fixa não generaliza e retirada extra falha',()=>{
 const m=mission(30);for(const s of missionVariants(m))assert.equal(end(s,m.solution.slice(1)).reason,'memoryUnknown');const unrolled=[inspectBoxes,{type:'for',times:1,body:transportCycle()},...seq('AAA')];assert.deepEqual(missionVariants(m).map(s=>end(s,unrolled).status),['won','collision','collision']);assert.equal(end(scenarios(30)[0],[...transportCycle(),removeBox]).reason,'preconditionFailed');
 const extra=clone(m.solution);extra[1].body=[removeBox];assert.equal(end(scenarios(30)[1],extra).reason,'preconditionFailed');
});
test('31: sem inspeção, N=0 faz um check gratuito sem corpo',()=>{
 const m=mission(31);assert.equal(m.commandOptions.some(o=>o.node.type==='inspect'),false);assert.equal(m.robotMemory,undefined);const trace=events(simulate(scenarios(31)[0],m.solution));assert.equal(trace.filter(e=>e.type==='loopCheck').length,1);assert.equal(trace.find(e=>e.type==='loopCheck').result,false);assert.equal(trace.some(e=>e.type==='interacted'),false);
});
test('32: três estações, corpo composto, duas direções; pular estação ou parar em duas não vence',()=>{
 const m=mission(32);const detour=[...seq('EADADAE'),...m.solution[0].body.slice(1),...m.solution[0].body,...m.solution[0].body,...seq('A')];assert.equal(end(scenarios(32)[0],detour).status,'won');assert.equal(end(scenarios(32)[1],detour).status,'collision');assert.equal(m.solution[0].body.length,3);assert.notDeepEqual(scenarios(32)[0].grid,scenarios(32)[1].grid);for(const s of missionVariants(m)){assert.equal(end(s).variables.registradas,3);const two=clone(m.solution);two[0].times=2;two.push({type:'move'});assert.equal(end(s,two).status,'finished');const skip=clone(m.solution);skip[0].body=seq('A');assert.notEqual(end(s,skip).status,'won');assert.notEqual(end(s,[...seq('AA'),...m.solution[0].body,...seq('A')]).status,'won');}
});
test('33: orçamento aceita referência e variação equivalente, insuficiência não publica descarte',()=>{
 const m=mission(33);for(const s of missionVariants(m)){const good=end(s);assert.equal(good.energyRemaining,2);assert.equal(end(s,[...seq('ED'),...m.solution]).status,'won');const low=clone(s);low.energy.initial=2;const depleted=end(low);assert.equal(depleted.status,'energyDepleted');assert.equal(depleted.variables.carregando,true);assert.equal(depleted.variables.descartadas,0);assert.equal(depleted.variables.restantes,s.initialVariables.restantes-1);assert.equal(depleted.energySpent,2);}
});
test('24: cenário original mantém frames/traces literais e novo norte funciona',()=>{
 const before=baseline.missions.find(m=>m.id===24),m=mission(24);const {variants,...base}=m;assert.deepEqual(base,before);assert.deepEqual(simulate(missionVariants(m)[0],m.solution),simulate(before,before.solution));assert.equal(end(missionVariants(m)[1]).status,'won');assert.equal(missionVariants(m)[1].start.direction,'N');
});
function dynamic(count=2){const m=mission(30);delete m.variants;m.robotMemory.quantidadeObservada.initial=count;if(Number.isSafeInteger(count)&&count>=0&&count<=20)m.initialVariables.restantes=count;m.solution=[m.solution[1],...seq('AAA')];return m;}
for(const n of [0,1,2,3,20])test(`for.count ${n}: snapshot, N+1 checks, no-op zero, trace e energia`,()=>{
 const m=dynamic(n);m.initialVariables.restantes=n;const states=simulate(m,m.solution);assert.equal(states.at(-1).status,'won');const checks=events(states).filter(e=>e.type==='loopCheck');assert.equal(checks.length,n+1);assert.equal(checks[0].times,n);assert.deepEqual(checks[0].count,observedCount);assert.equal(states.at(-1).variables.descartadas,n);assert.equal(checks.at(-1).result,false);
});
for(const n of [null,-1,1.5,21])test(`for.count inválido ${n}: falha tipada sem corpo, uma instrução`,()=>{
 const m=dynamic(n),before=initialState(m),last=end(m);assert.equal(last.status,'actionFailed');assert.equal(last.reason,n===null?'memoryUnknown':'loopCountInvalid');assert.equal(last.instructionPointer,1);assert.deepEqual(last.variables,before.variables);assert.deepEqual(last.memory,before.memory);assert.equal(last.row,before.row);
});
test('fonte dinâmica rejeita infinito/NaN em runtime sem efeitos; memória desconhecida nunca é zero',()=>{
 const m=dynamic(1);for(const value of [NaN,Infinity,-Infinity]){const e=createExecution(m,m.solution);e.state.memory.quantidadeObservada.value=value;const next=stepExecution(m,m.solution,e);assert.equal(next.state.reason,'loopCountInvalid');assert.deepEqual(next.state.variables,e.state.variables);}
});
test('for congela quantidade na ativação, frames imutáveis mesmo alterando memória no corpo',()=>{
 const m=dynamic(2);m.goal={row:2,col:4};const write={type:'setMemory',variable:'quantidadeObservada',value:0};m.commandOptions.push({id:'zerar',label:'Zerar memória',node:write});m.solution=[{type:'for',count:observedCount,body:[write,...transportCycle()]}];let e=createExecution(m,m.solution);const start=freeze(e);e=stepExecution(m,m.solution,start);assert.equal(e.frames.find(f=>f.kind==='loop').times,2);assert.deepEqual(start.frames,[{path:[],index:0}]);const states=simulate(m,m.solution);assert.equal(states.at(-1).variables.descartadas,2);assert.equal(states.at(-1).memory.quantidadeObservada.value,0);
});
test('autorização canônica, exclusão times/count e memória numérica',()=>{
 const m=dynamic(1),node=m.solution[0];const shuffled={...node,count:{name:'quantidadeObservada',kind:'memoryVariable'}};validateProgram([shuffled],m);assert.equal(loopPermissions(m),loopPermissions({...m,loopOptions:[{...m.loopOptions[0],count:{name:'quantidadeObservada',kind:'memoryVariable'}},...m.loopOptions.slice(1)]}));assert.deepEqual(createLoop(m,'observado'),{type:'for',count:observedCount,body:[]});
 for(const bad of [{...node,times:2},{...node,count:{kind:'worldVariable',name:'restantes'}},{...node,count:{kind:'memoryVariable',name:'other'}},{...node,count:{...observedCount,extra:true}},{type:'for',body:[]}])assert.throws(()=>validateProgram([bad],m));
 const wrong=clone(m);wrong.robotMemory.quantidadeObservada.type='string';wrong.robotMemory.quantidadeObservada.initial='1';assert.throws(()=>validateMission(wrong));const variant=mission(30);variant.variants[1].loopOptions=[{id:'observado',label:'Fixo',kind:'for',times:2}];assert.throws(()=>validateMission(variant));
});
test('for.count aninhado, no SE/ESCOLHA, limite, interrupção e stagnação permanecem controlados',()=>{
 const m=dynamic(2);m.goal={row:2,col:4};m.conditionOptions=[{id:'livre',label:'Livre?',condition:{type:'pathClear'}}];m.switchOptions=[{id:'mundo',label:'Restantes',selector:{kind:'worldVariable',name:'restantes'},cases:[{value:1,label:'Um'},{value:2,label:'Dois'}]}];m.loopOptions.push({id:'dois',label:'Duas vezes',kind:'for',times:2});
 const turn={type:'turnLeft'},inner={type:'for',count:observedCount,body:[turn]},outer={type:'for',times:2,body:[{type:'if',condition:{type:'pathClear'},then:[inner],else:[inner]}]};assert.equal(events(simulate(m,[outer])).filter(e=>e.action==='turnLeft').length,0);const states=simulate(m,[outer]);assert.equal(states.at(-1).instructionPointer,15);assert.equal(states.at(-1).direction,'L');
 const sw={type:'switch',selector:{kind:'worldVariable',name:'restantes'},cases:[{value:1,body:[]},{value:2,body:[inner]}],default:[]};assert.equal(simulate(m,[sw]).at(-1).direction,'O');const e=stepExecution(m,[outer],createExecution(m,[outer]));assert.equal(interruptExecution(e).state.status,'stopped');assert.equal(simulate(m,[outer],{instructionLimit:1}).at(-1).status,'limit');
});
for(const id of [26,27,28,29,30,31,32,33])test(`${id}: step/simulate/session/playtest/importação/JSON equivalentes`,()=>{
 const m=mission(id),portable=parseMission(serializeMission(m));assert.deepEqual(portable,m);assert.equal(serializeMission(portable),serializeMission(m));for(const s of missionVariants(m)){let e=createExecution(s,m.solution);const states=[e.state];while(!['won','finished','collision','actionFailed','limit','energyDepleted','stalled'].includes(e.state.status)){e=stepExecution(s,m.solution,e);states.push(e.state);}assert.deepEqual(states,simulate(s,m.solution));}
 let s=finishSession(createSession(portable,portable.solution));if(s.scenarios.length>1)s=finishSession(startVariantTests(s));assert.equal(s.completed,true);const t=finishTest(createPlaytest(portable));assert(referenceValidated(t,portable));assert.equal(t.reports.length,missionVariants(m).length);assert.deepEqual(loadImportedGame(serializeMission(m),null).program,[]);
});
test('exemplos completos 30/31 executam e round-trip, draft incompleto preserva count',()=>{
 for(const [id,name]of [[30,'for'],[31,'while']]){const m=parseMission(readFileSync(new URL(`../docs/V092-boxes-${name}-example.json`,import.meta.url),'utf8'));assert.deepEqual(m,mission(id));assert.equal(finishTest(createPlaytest(m)).reports.every(r=>r.status==='won'),true);}
 const partial={id:'partial',loopOptions:[{kind:'for',count:{kind:'memoryVariable'}}],solution:[{type:'for',count:{name:null},body:[]}]};assert.deepEqual(parseDraft(serializeDraft(partial)),partial);
});
test('Studio: fonte dinâmica por controle real, edição da memória, undo/redo e preservação do corpo',()=>{
 const c=studioController(),m=mission(30);c.app.importText(serializeMission(m));c.click({open:JSON.stringify(['loopOptions',0])});assert.match(c.element('#inspector').innerHTML,/data-for-source/);assert.match(c.element('#inspector').innerHTML,/memory/);const before=c.app.getDraft();c.change({forSource:JSON.stringify(['loopOptions',0])},'literal');assert.equal(c.app.getDraft().mission.loopOptions[0].times,4);assert.deepEqual(c.app.getDraft().mission.solution,before.mission.solution);c.element('#undo').onclick();assert.deepEqual(c.app.getDraft().mission,before.mission);c.element('#redo').onclick();assert.equal(c.app.getDraft().mission.loopOptions[0].count,undefined);c.change({forSource:JSON.stringify(['loopOptions',0])},'memory');assert.deepEqual(c.app.getDraft().mission.loopOptions[0].count,observedCount);
 c.change({value:JSON.stringify(['loopOptions',0,'count','name']),kind:'string'},'outra');assert.equal(c.app.getDraft().mission.loopOptions[0].count.name,'outra');assert(c.element('#export').disabled);c.element('#undo').onclick();assert.deepEqual(c.app.getDraft().mission.loopOptions[0].count,observedCount);
 c.element('#instruction-limit').value='1000';c.element('#test-all').onclick();while(c.timers.size)c.next();assert.equal(c.app.getTest().reports.length,3);assert(c.app.getTest().reports.every(r=>r.status==='won'));assert.match(c.element('#test-report').innerHTML,/won|Vitória|Conclu/);assert.deepEqual(parseMission(serializeMission(c.app.getDraft().mission)).solution,m.solution);
});
test('jogo: construir REPITA dinâmico usando controles e testar todas as variantes importadas',async()=>{
 const c=await gameController();const m=mission(30);m.id='copia-pilha';await c.import(m);assert.deepEqual(c.get().program,[]);
 const button=dataset=>({dataset,disabled:false,hidden:false,closest(){return this;}});
 c.element('.palette').onclick({target:button({commandOption:'inspecionar'})});c.addLoop('observado');c.element('#program').onclick({target:button({target:'1.body'})});assert.match(c.element('#program').innerHTML,/data-inline-option="retirar"/);
 for(const node of transportCycle())c.element('#program').onclick({target:button({...(node.type==='interact'?{inlineOption:node.actionId}:{inlineAdd:node.type}),target:'1.body'})});c.element('#root-target').onclick();for(let i=0;i<3;i++)c.add('move');assert.deepEqual(c.get().program,m.solution);assert.match(c.element('#program').innerHTML,/Quantidade observada/);
 c.element('#run').onclick();while(c.timers.size)c.next();assert.equal(c.get().session.execution.state.status,'won');c.element('#test-variants').onclick();while(c.timers.size)c.next();assert(c.get().session.completed);assert.deepEqual(c.get().completed,[]);assert.match(c.element('#board').innerHTML,/Lixeira: 3/);c.element('#back-missions').onclick();assert.equal(c.get().mission.id,1);
});
test('loop labels explicitam origem, quantidade resolvida e erro',()=>{
 const m=mission(30);assert.match(loopTitle(m,m.solution[1]),/Quantidade observada/);assert.doesNotMatch(renderLoopPalette(m),/undefined/);let e=createExecution(scenarios(30)[1],m.solution);e=stepExecution(scenarios(30)[1],m.solution,e);e=stepExecution(scenarios(30)[1],m.solution,e);assert.match(renderLoopTrace(m,e,m.solution),/de 2.*memória/);
});
test('contagem dinâmica cobra só ações, preserva limite/stop e reavalia na próxima ativação',()=>{
 const m=dynamic(2);m.energy={initial:30,costs:{move:2,turnLeft:1,turnRight:1,interact:2,inspect:0,setMemory:0}};assert.equal(end(m).energyRemaining,0);assert.equal(events(simulate(m,m.solution)).filter(e=>e.type==='loopCheck').length,3);
 const limited=simulate(m,m.solution,{instructionLimit:1}).at(-1);assert.equal(limited.status,'limit');assert.equal(limited.energyRemaining,30);assert.equal(limited.variables.descartadas,0);
 const e=stepExecution(m,m.solution,createExecution(m,m.solution)),stopped=interruptExecution(e);assert.equal(stopped.state.energyRemaining,30);assert.equal(stopped.state.instructionPointer,1);assert.deepEqual(stopped.frames,[]);assert.equal(createExecution(m,m.solution).state.memory.quantidadeObservada.value,2);
 const write={type:'setMemory',variable:'quantidadeObservada',value:0};m.commandOptions.push({id:'zero',label:'Guardar zero',node:write});const p=[{type:'for',count:observedCount,body:[...transportCycle(),write]},{type:'for',count:observedCount,body:[removeBox]}];const trace=events(simulate(m,p)).filter(e=>e.type==='loopCheck');assert.equal(trace.at(-1).times,0);assert.equal(trace.at(-1).result,false);assert.equal(trace.filter(e=>e.path[0]===0&&e.result).length,2);
});
test('Studio alterna preset literal/dinâmico pelos selects sem perder corpo; cancelar conserva fonte',()=>{
 const c=studioController(),m=mission(30);c.app.importText(serializeMission(m));const body=clone(m.solution[1].body);c.change({field:'loop-option',path:'1'},'uma');assert.equal(c.app.getDraft().mission.solution[1].times,1);assert.equal(c.app.getDraft().mission.solution[1].count,undefined);assert.deepEqual(c.app.getDraft().mission.solution[1].body,body);c.change({field:'loop-option',path:'1'},'observado');assert.deepEqual(c.app.getDraft().mission.solution[1],m.solution[1]);c.allow(false);const before=c.app.getDraft();c.change({forSource:JSON.stringify(['loopOptions',0])},'literal');assert.deepEqual(c.app.getDraft(),before);
});
test('novas missões rejeitam decisões fixas e omissões entre variantes, inclusive 31/33',()=>{
 for(const id of [26,27,28,29]){const m=mission(id);const linear=id===26?[...m.solution.slice(0,7),m.commandOptions.find(o=>o.node.type==='interact').node,...m.solution.slice(8)]:id===27?m.solution[0].then:[m.commandOptions[0].node,...seq('AAAA')];const outcomes=missionVariants(m).map(s=>end(s,linear).status);assert(outcomes.includes('won'),`${id}: negativo deve vencer um cenário`);assert(outcomes.some(s=>s!=='won'),`${id}: negativo deve falhar noutro`);}
 for(const id of [31,33]){const p=[...transportCycle(),...seq('AAA')];const ss=scenarios(id);assert.equal(ss.some(s=>end(s,p).status==='won'),true);assert.equal(ss.some(s=>end(s,p).status!=='won'),true);}
});
test('bindings visuais de quantidade seguros; pilha vazia desaparece e lixeira vazia segue visível',()=>{
 const m=scenarios(31)[0],scene=resolveScene(m,initialState(m));assert.equal(scene.entities.find(e=>e.id==='pilha').quantityEmpty,'hideImage');assert.equal(scene.entities.find(e=>e.id==='lixeira').quantityEmpty,'show');const html=renderSceneBoard(m,initialState(m));assert.match(html,/quantity-empty/);assert.match(html,/Pilha de caixas: 0 \(vazio\)/);assert.match(html,/reactive\/bin_idle/);
 for(const quantity of [{source:'script',name:'restantes'},{source:'variable',name:'constructor'},{source:'property',name:'quantidade',empty:'https://bad'},{source:'property',name:'quantidade',url:'https://bad'}]){const bad=mission(30);bad.presentation.visual.entities.pilha.quantity=quantity;assert.throws(()=>parseMission(JSON.stringify(bad)));}
});
test('85 SVGs históricos byte a byte preservados; não há operador E/OU infantil novo',async()=>{
 const assets=JSON.parse(readFileSync(new URL('./fixtures/v091-asset-digests.json',import.meta.url)));assert.equal(Object.keys(assets).length,85);for(const [file,digest]of Object.entries(assets))assert.equal(createHash('sha256').update(readFileSync(new URL('../'+file,import.meta.url))).digest('hex'),digest);
 const {decisionTypes}=await import('../src/condition-options.js');assert(!decisionTypes.includes('all'));assert(!decisionTypes.includes('any'));assert(!decisionTypes.includes('or'));
});
test('jogo: ESCOLHA importado construído com quatro casos reais vence quatro variantes',async()=>{
 const c=await gameController(),m=mission(28);m.id='quatro-destinos-importada';await c.import(m);const button=dataset=>({dataset,disabled:false,hidden:false,closest(){return this;}});
 c.element('.palette').onclick({target:button({switchOption:'por_identificador'})});
 for(let n=0;n<4;n++){const target=`0.cases.${n}.body`;assert(c.element('#program').innerHTML.includes(`data-target="${target}"`));c.element('#program').onclick({target:button({target})});assert(c.element('#program').innerHTML.includes(`data-inline-option="destino${n}"`));c.element('#program').onclick({target:button({inlineOption:`destino${n}`,target})});}
 c.element('#root-target').onclick();for(let n=0;n<4;n++)c.add('move');assert.deepEqual(c.get().program,m.solution);c.element('#run').onclick();while(c.timers.size)c.next();assert.equal(c.get().session.execution.state.status,'won');c.element('#test-variants').onclick();while(c.timers.size)c.next();assert.equal(c.get().session.passed.length,4);assert(c.get().session.completed);assert.deepEqual(c.get().completed,[]);
});
test('for.count preserva limites estruturais de profundidade e 300 nós',()=>{
 const m=dynamic(2);let nested=[{type:'turnLeft'}];for(let i=0;i<8;i++)nested=[{type:'for',count:observedCount,body:nested}];validateProgram(nested,m);assert.throws(()=>validateProgram([{type:'for',count:observedCount,body:nested}],m));const program=[{type:'for',count:observedCount,body:Array.from({length:299},()=>({type:'turnRight'}))}];validateProgram(program,m);program[0].body.push({type:'turnRight'});assert.throws(()=>validateProgram(program,m));
});
test('relatório conserva fonte/quantidade resolvida e trace completo (V094)',()=>{
 const m=dynamic(20);m.solution=[{type:'for',count:observedCount,body:Array.from({length:299},()=>({type:'turnLeft'}))}];const t=finishTest(createPlaytest(m,{instructionLimit:10000}));assert.equal(t.trace.length,6001);assert.deepEqual(t.reports[0].loopCounts,[{path:[0],count:observedCount,times:20}]);assert.equal(t.reports[0].status,'finished');
});
