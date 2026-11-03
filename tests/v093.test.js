import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {missions,missionVariants} from './helpers/historical-catalog.js';
import {simulate,initialState,applyCommand} from '../src/engine.js';
import {createSession,stepSession,canStep,startVariantTests,interruptSession} from '../src/session.js';
import {normalizeProgress,isUnlocked,currentMission,parseProgress,serializeProgress,createProgressStore,PROGRESS_KEY} from '../src/progress.js';
import {variantPreview} from '../src/variant-preview.js';
import {serializeMission,parseMission,serializeDraft,parseDraft} from '../src/mission-io.js';
import {createPlaytest,stepPlaytest} from '../src/studio/playtest.js';
import {resolveScene} from '../src/presentation/visual-resolver.js';
import {renderBoard,describeEnvironment} from '../src/view.js';
import {passageIndicators} from '../src/command-view.js';
import {seq} from '../src/lock-mission-data.js';
import {removeBox,discardBox,transportCycle} from '../src/demo-missions-v092.js';
import {canonical,loopOption} from '../src/loops.js';
import {gameController,memoryStorage,studioController} from './helpers/historical-controllers.js';
const clone=structuredClone;
const mission=id=>clone(missions.find(m=>m.id===id));
const end=(m,p=m.solution)=>simulate(m,p).at(-1);
const hash=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex');
const strip=x=>Array.isArray(x)?x.map(strip):x&&typeof x==='object'?Object.fromEntries(Object.entries(x).filter(([k])=>k!=='presentation').map(([k,v])=>[k,strip(v)])):x;
const baseline=JSON.parse(readFileSync(new URL('./fixtures/v092-ux-baseline.json',import.meta.url)));
const finish=s=>{let n=0;while(canStep(s)){assert(++n<5000);s=stepSession(s);}return s;};
const finishTest=t=>{let n=0;while(!t.done){assert(++n<10000);t=stepPlaytest(t);}return t;};
const button=dataset=>({dataset,disabled:false,hidden:false,closest(){return this;}});
function select(c,id){c.element('#missions').onclick({target:button({mission:String(id)})});}
function populate(c,list,m,path=[]){
 const restore=()=>path.length?c.element('#program').onclick({target:button({target:path.join('.')})}):c.element('#root-target').onclick();restore();
 for(const node of list){const before=c.get().program;let current=before;for(const part of path)current=current[part];const i=current.length;
 let data;if(['move','turnLeft','turnRight','if'].includes(node.type))data=path.length?{inlineAdd:node.type}:{add:node.type};
 else if(['for','while'].includes(node.type)){const id=loopOption(m,node).id;data=path.length?{inlineLoop:id}:{loopOption:id};}
 else if(node.type==='switch'){const id=m.switchOptions.find(o=>canonical(o.selector)===canonical(node.selector)).id;data=path.length?{inlineSwitch:id}:{switchOption:id};}
 else {const id=m.commandOptions.find(o=>canonical(o.node)===canonical(node)).id;data=path.length?{inlineOption:id}:{commandOption:id};}
 if(path.length){data.target=path.join('.');c.element('#program').onclick({target:button(data)});}else c.element('.palette').onclick({target:button(data)});
 const root=[...path,i];if(node.type==='if'){populate(c,node.then,m,[...root,'then']);populate(c,node.else,m,[...root,'else']);restore();}
 if(node.type==='switch'){node.cases.forEach((item,k)=>populate(c,item.body,m,[...root,'cases',k,'body']));populate(c,node.default,m,[...root,'default']);restore();}
 if(['for','while'].includes(node.type)){populate(c,node.body,m,[...root,'body']);restore();}
 }
}
function seeded(n){const storage=memoryStorage();storage.setItem(PROGRESS_KEY,serializeProgress(missions,new Set(missions.slice(0,n).map(m=>m.id))));return storage;}
for(const record of baseline.missions)test(`V093: ${record.id} mantém domínio/trace V092, exceto transporte autorizado`,()=>{
 const m=mission(record.id);if([30,31,33].includes(m.id))return;
 assert.equal(hash(strip(m)),record.domain);if(m.id<=8)assert.equal(hash(m),record.definition);
 for(const [i,s]of missionVariants(m).entries()){if(m.id===5)assert.equal(end(s).reason,'commandsRemaining');else assert.equal(hash(simulate(s,m.solution)),record.scenarios[i].trace);if(m.id<=8)assert.equal(hash(renderBoard(s,initialState(s)).replace(/file:\/\/[^'"\s)]*?\/src\/assets\//g,'assets/')),record.scenarios[i].board);}
});
for(const id of [30,31,33])test(`${id}: retirada, transporte à casa própria, descarte e retorno em todos cenários`,()=>{
 const m=mission(id);assert.deepEqual(m.entities.find(e=>e.id==='lixeira')&&[m.entities[1].row,m.entities[1].col],[3,1]);assert.deepEqual([m.start.row,m.start.col],[2,1]);assert.equal(m.grid.obstacles.some(p=>p.row===3&&p.col===1),false);
 for(const s of missionVariants(m)){const n=s.initialVariables.restantes,states=simulate(s,m.solution),last=states.at(-1);assert.equal(last.status,'won');assert.deepEqual(last.variables,{restantes:0,carregando:false,descartadas:n});const discards=states.filter(st=>st.events.some(e=>e.type==='interacted'&&e.actionId==='descartar'));assert.equal(discards.length,n);assert(discards.every(st=>st.row===3&&st.col===1));assert.equal(states.filter(st=>st.events.some(e=>e.type==='moved'&&st.row===3&&st.col===1)).length,n);
  const remote=end(s,[discardBox]);assert.equal(remote.reason,'outOfReach');assert.deepEqual(remote.variables,s.initialVariables);if(s.energy)assert.equal(remote.energySpent,0);
  if(n){assert.equal(end(s,[removeBox,discardBox]).reason,'outOfReach');assert.equal(end(s,[removeBox,removeBox]).reason,'preconditionFailed');assert.equal(end(s,seq('A')).reason,'stackBlocked');const occupied=end(s,[removeBox,...seq('DA'),discardBox]);assert.equal(occupied.variables.descartadas,1);assert.equal(occupied.variables.carregando,false);}
  const {variantId,variantLabel,label,...portable}=s;const loaded=parseMission(serializeMission(portable));assert.equal(end(loaded).status,'won');let session=finish(createSession(s,m.solution));assert.equal(session.execution.state.status,'won');assert.equal(finishTest(createPlaytest({...portable,solution:m.solution})).reports[0].status,'won');
 }
});
test('zero caixas não visita lixeira; carregar a última sem descartar não vence',()=>{
 const zero=missionVariants(mission(31))[0],states=simulate(zero,zero.solution);assert.equal(states.some(s=>s.row===3),false);assert.equal(states.flatMap(s=>s.events).some(e=>e.type==='interacted'),false);const one=missionVariants(mission(31))[1];const carrying=end(one,[removeBox,...seq('AAA')]);assert.equal(carrying.status,'finished');assert.equal(carrying.variables.carregando,true);
 const noBox=end(one,[...seq('DA'),discardBox]);assert.equal(noBox.reason,'preconditionFailed');assert.deepEqual(noBox.variables,one.initialVariables);
});
test('energia 33: custo real 18/30, orçamento 20/32 e alternativa válida com quatro curvas à esquerda',()=>{
 for(const [i,m]of missionVariants(mission(33)).entries()){const reference=end(m);assert.equal(reference.energySpent,[18,30][i]);assert.equal(m.energy.initial,[20,32][i]);assert.equal(reference.energyRemaining,2);assert.equal(end(m,[...seq('ED'),...m.solution]).status,'won');const alt=clone(m.solution);alt[0].body=[removeBox,...seq('DA'),discardBox,...seq('EEAD')];assert.equal(end(m,alt).status,'won');
 const low=clone(m);low.energy.initial=2;const fail=end(low);assert.equal(fail.status,'energyDepleted');assert.equal(fail.direction,'L');assert.equal(fail.row,2);assert.equal(fail.variables.carregando,true);assert.equal(fail.energySpent,2);
 }
});
test('reset, stop e variante nova restauram caixa, energia e memória próprias',()=>{
 const m=mission(30);let s=createSession(m,m.solution);for(let i=0;i<5;i++)s=stepSession(s);const snapshot=clone(s.execution.state);const stopped=interruptSession(s);assert.equal(stopped.execution.state.status,'stopped');assert.deepEqual(stopped.execution.state.variables,snapshot.variables);assert.deepEqual(createSession(m,m.solution).execution.state.variables,m.initialVariables);s=finish(createSession(m,m.solution));s=startVariantTests(s);assert.equal(s.execution.state.variables.descartadas,0);assert.equal(s.execution.state.variables.restantes,2);assert.equal(s.execution.state.memory.quantidadeObservada.known,false);assert(finish(s).completed);
});
test('progresso usa ordem do catálogo, IDs estritos, prefixo e formato determinístico',()=>{
 const catalog=[{id:40},{id:'B'},{id:3}];assert.deepEqual([...normalizeProgress(catalog,[40,3])],[40]);assert(isUnlocked(catalog,new Set([40]),'B'));assert(!isUnlocked(catalog,new Set([40]),3));assert.equal(currentMission(catalog,new Set([40])).id,'B');assert.equal(currentMission(catalog,new Set([40,'B',3])).id,3);
 const text=serializeProgress(catalog,new Set([3,'B',40]));assert.equal(text,'{"format":"algo-kids-progress/v1","completedMissionIds":[40,"B",3]}');assert.deepEqual([...parseProgress(catalog,text)],[40,'B',3]);assert.deepEqual([...parseProgress(missions,JSON.stringify({format:PROGRESS_KEY,completedMissionIds:[1,1,999,3]}))],[1]);assert.deepEqual([...parseProgress(missions,JSON.stringify({format:PROGRESS_KEY,completedMissionIds:['1',2]}))],[]);
});
for(const text of ['', 'x','null','[]','{}','{"format":"other","completedMissionIds":[1]}','{"format":"algo-kids-progress/v1","completedMissionIds":[1],"__proto__":{}}'])test(`progresso inválido não desbloqueia: ${text}`,()=>{
 const storage=memoryStorage();storage.setItem(PROGRESS_KEY,text);assert.equal(createProgressStore(missions,()=>storage).load().completed.size,0);
});
test('storage ausente/erro/quota é degradável; não inventa migração de progresso antigo',async()=>{
 const broken={getItem(){throw Error('privado');},setItem(){throw Error('quota');}};assert.equal(createProgressStore(missions,()=>broken).load().completed.size,0);assert.equal(createProgressStore(missions,()=>broken).save(new Set([1])).ok,false);
 const c=await gameController({storage:broken});populate(c,mission(1).solution,mission(1));c.element('#run').onclick();while(c.timers.size)c.next();assert.deepEqual(c.get().completed,[1]);assert.match(c.element('#progress-storage').textContent,/sessão.*não permitiu salvar/);assert.equal(c.get().session.execution.state.status,'won');c.element('#advance-mission').onclick();assert.equal(c.get().mission.id,2);
 const old=memoryStorage();old.setItem('algo-kids-old-completed','[1,2,3]');assert.equal((await gameController({storage:old})).get().mission.id,1);
});
test('catálogo bloqueado: handler adulterado não limpa AST, alvo nem sessão',async()=>{
 const c=await gameController();c.add('move');const before=c.get();select(c,33);assert.deepEqual(c.get(),before);assert.match(c.element('#missions').innerHTML,/Conclua a missão anterior/);assert.match(c.element('#missions').innerHTML,/data-mission="2" disabled/);assert.equal(c.get().mission.id,1);assert.equal(c.storage.getItem(PROGRESS_KEY),null);
});
test('conquista salva apenas ao vencer; reload abre próxima; repetir/falhar não apaga',async()=>{
 const c=await gameController();populate(c,mission(1).solution,mission(1));assert.equal(c.storage.getItem(PROGRESS_KEY),null);c.element('#run').onclick();while(c.timers.size)c.next();assert.deepEqual(JSON.parse(c.storage.getItem(PROGRESS_KEY)).completedMissionIds,[1]);assert.equal(c.get().mission.id,1);assert.equal(c.element('#next-mission').hidden,false);const reload=await gameController({storage:c.storage});assert.equal(reload.get().mission.id,2);assert.deepEqual(reload.get().program,[]);select(reload,1);reload.add('turnLeft');reload.add('move');reload.element('#run').onclick();while(reload.timers.size)reload.next();assert.deepEqual(reload.get().completed,[1]);assert.deepEqual(JSON.parse(reload.storage.getItem(PROGRESS_KEY)).completedMissionIds,[1]);
});
test('treino de variante não desbloqueia; só a mesma AST vencedora em todas salva',async()=>{
 const storage=seeded(8),c=await gameController({storage});const m=mission(9);assert.equal(c.get().mission.id,9);populate(c,m.solution,m);assert.deepEqual(c.get().program,m.solution);c.element('#run').onclick();while(c.timers.size)c.next();assert.equal(c.get().session.passed.length,1);assert.equal(c.get().session.completed,false);assert.equal(JSON.parse(storage.getItem(PROGRESS_KEY)).completedMissionIds.length,8);select(c,10);assert.equal(c.get().mission.id,9);
 c.element('#test-variants').onclick();while(c.timers.size)c.next();assert(c.get().session.completed);assert.equal(JSON.parse(storage.getItem(PROGRESS_KEY)).completedMissionIds.length,9);c.element('#advance-mission').onclick();assert.equal(c.get().mission.id,10);
});
test('prévia 1/2/3/4 cenários é uma cena inicial independente e não contém solução',()=>{
 for(const id of [1,9,21,26,30]){const m=mission(id),s=createSession(m,m.solution),before=clone(s);for(let i=0;i<s.scenarios.length;i++){const p=variantPreview(s.scenarios,i);assert.equal(p.state.instructionPointer,0);assert(p.state.memory?Object.values(p.state.memory).every(v=>!v.known||m.robotMemory?.initial!==null):true);assert.equal(p.width,5);assert.match(p.label,/Prévia — não é uma execução/);assert.doesNotMatch(p.html,/ak-fx|ak-mood-celebrate|ak-result/);assert.deepEqual(s,before);}}
});
for(const id of [9,21,26,30])test(`prévia ${id}: não muda AST, alvo, sessão, caches ou conquistas`,async()=>{
 const c=await gameController({storage:seeded(id-1)}),m=mission(id);if(id===30){populate(c,[m.solution[1]],m);c.element('#program').onclick({target:button({target:'0.body'})});}else c.add('move');const before=c.get(),html=c.element('#board').innerHTML,storage=c.storage.getItem(PROGRESS_KEY);c.element('#preview-variant').value=String(missionVariants(m).length-1);c.element('#preview-variant').onchange({target:c.element('#preview-variant')});const after=c.get();assert.equal(after.previewVariantIndex,missionVariants(m).length-1);delete after.previewVariantIndex;delete before.previewVariantIndex;assert.deepEqual(after,before);assert.equal(c.element('#board').innerHTML,html);assert.equal(c.timers.size,0);assert.equal(c.storage.getItem(PROGRESS_KEY),storage);assert.match(c.element('#preview-board').innerHTML,/ak-cell/);c.element('#reset').onclick();assert.equal(c.get().previewVariantIndex,0);
});
test('prévia durante pausa preserva foco; execução continua no treino e zero em reset',async()=>{
 const c=await gameController({storage:seeded(29)}),m=mission(30);populate(c,m.solution,m);c.element('#preview-variant').value='2';c.element('#preview-variant').onchange({target:c.element('#preview-variant')});c.element('#run').onclick();assert.equal(c.get().session.scenarioIndex,0);assert.equal(c.get().previewVariantIndex,0);c.element('#pause').onclick();const before=c.get();c.element('#preview-variant').focus();c.element('#preview-variant').value='1';c.element('#preview-variant').onchange({target:c.element('#preview-variant')});assert.deepEqual(c.get().session,before.session);assert.equal(c.element('#preview-variant').disabled,false);assert.equal(c.timers.size,0);c.element('#pause').onclick();assert.equal(c.element('#preview-variant').disabled,true);
});
test('importação de ID oficial tem prévia e vitória sem desbloqueio; retorno restaura sessão',async()=>{
 const c=await gameController(),official=c.get(),m=mission(9);m.id=1;await c.import(m);populate(c,m.solution,m);c.element('#preview-variant').value='1';c.element('#preview-variant').onchange({target:c.element('#preview-variant')});c.element('#run').onclick();while(c.timers.size)c.next();c.element('#test-variants').onclick();while(c.timers.size)c.next();assert(c.get().session.completed);assert.deepEqual(c.get().completed,[]);assert.equal(c.storage.getItem(PROGRESS_KEY),null);c.element('#back-missions').onclick();assert.deepEqual(c.get().session,official.session);assert.deepEqual(c.get().program,official.program);assert.equal(c.get().previewVariantIndex,0);
});
test('prefixos de 0 ao último nível não dependem de aritmética e reset não apaga',()=>{
 let done=new Set();for(const [i,m]of missions.entries()){assert.equal(currentMission(missions,done).id,m.id);assert.equal(isUnlocked(missions,done,m.id),true);assert.equal(isUnlocked(missions,done,missions[i+1]?.id),false);done.add(m.id);done=parseProgress(missions,serializeProgress(missions,done));}assert.equal(done.size,33);assert.equal(currentMission(missions,done).id,33);
});
for(const id of [17,21,22,26])test(`segredos ${id}: prévia/mapa/aria não revelam atributos antes de inspecionar`,()=>{
 const m=mission(id);for(const scenario of missionVariants(m)){const start=initialState(scenario),scene=resolveScene(scenario,start),preview=variantPreview([scenario],0);if(id===17){assert.equal(scene.features[0].value,'?');assert.equal(scene.features[0].asset.id,'reactive/terminal_idle');assert.doesNotMatch(preview.label,/Placa: (Vermelha|Azul)/);}else {const b=scene.barriers.find(b=>b.id==='passagem');assert.equal(b.properties.cor,'?');assert.doesNotMatch(passageIndicators(scenario,start),/Cor: (vermelho|azul|verde)/);if(id!==26)assert.equal(scene.entities.find(e=>e.id==='fechadura').asset.id,'reactive/terminal_idle');}
 const observed=simulate(scenario,m.solution).find(s=>s.lastEvent==='inspected');assert(observed);assert.notEqual(resolveScene(scenario,observed).features[0]?.value,'?');assert.doesNotMatch(preview.name,/vermelh|azul|verde|redonda|quadrada/);}
});
test('identificações explícitas do catálogo inteiro; badges são texto visível e atributos de decisão também',()=>{
 let count=0;for(const m of missions)for(const s of missionVariants(m)){count++;const scene=resolveScene(s,initialState(s)),html=renderBoard(s,initialState(s));if(m.id>8){for(const e of scene.entities)assert(e.badge,`${m.id} ${e.id}`);for(const b of scene.barriers)assert(b.badge,`${m.id} ${b.id}`);for(const e of scene.entities)assert(html.includes(`>${e.badge}</span>`),`${m.id} ${e.id}`);}assert.match(html,/aria-label="Destino"/);}assert.equal(count,71);
 const m=mission(27),html=renderBoard(m,initialState(m));assert.equal(m.barriers.length,2);assert.match(html,/A \| B/);assert.match(html,/A: Não/);assert.match(html,/B: Não/);assert.match(html,/>Porta<|>Desvio</);assert.doesNotMatch(html,/Portão A|Portão B/);
 assert.match(renderBoard(mission(28),initialState(mission(28))),/ID: 0/);assert.match(renderBoard(mission(29),initialState(mission(29))),/>carta<.*>norte</);assert.match(renderBoard(mission(20),initialState(mission(20))),/>Ponte A<.*Até: 1/);
});
test('JSON/Studio: metadados estruturados portáteis, escape e rejeição de vínculos maliciosos',()=>{
 const m=mission(27);assert.deepEqual(parseMission(serializeMission(m)),m);const c=studioController();c.app.importText(serializeMission(m));c.click({open:JSON.stringify(['presentation','visual','entities','controle'])});assert.match(c.element('#inspector').innerHTML,/badge|details/);c.change({value:JSON.stringify(['presentation','visual','entities','controle','badge']),kind:'string'},'<b>A&B</b>');const edited=c.app.getDraft().mission;const html=renderBoard(edited,initialState(edited));assert.match(html,/&lt;b&gt;A&amp;B&lt;\/b&gt;/);assert(!html.includes('<b>A&B</b>'));
 for(const alter of [x=>x.badge='x'.repeat(25),x=>x.observedProperties={cor:'constructor'},x=>x.observedProperties={cor:'naoDeclarada'},x=>x.details=[{source:'script',name:'x'}],x=>x.details=[{source:'variable',name:'x',url:'https://evil'}]]){const n=mission(27);alter(n.presentation.visual.entities.controle);assert.throws(()=>parseMission(JSON.stringify(n)));}
 const draft={id:'parcial',presentation:{visual:{entities:{a:{observedProperties:{cor:null}}}}}};assert.deepEqual(parseDraft(serializeDraft(draft)),draft);
});
test('header reutiliza MK1 leste, caminho relativo e decoração acessível',()=>{
 const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');assert.match(html,/class="brand-icon"><img src="src\/assets\/robots\/mk1\/e.svg"[^>]*alt=""/);assert(!html.includes('src="/src/assets'));
});
test('prévia não aceita troca durante playback e não rouba foco nem desfaz inserções',async()=>{
 const c=await gameController({storage:seeded(29)}),m=mission(30);c.element('#preview-variant').value='2';c.element('#preview-variant').onchange({target:c.element('#preview-variant')});c.add('move');assert.equal(c.get().previewVariantIndex,2);assert.match(c.element('#preview-board').innerHTML,/Pilha de caixas: 3/);c.element('#program').focus();const focused=c.active(),before=c.get();c.element('#preview-variant').value='1';c.element('#preview-variant').onchange({target:c.element('#preview-variant')});assert.equal(c.active(),focused);assert.deepEqual(c.get().program,before.program);c.element('#clear').onclick();populate(c,m.solution,m);c.element('#run').onclick();const running=c.get(),timers=c.timers.size;c.element('#preview-variant').value='2';c.element('#preview-variant').onchange({target:c.element('#preview-variant')});assert.deepEqual(c.get(),running);assert.equal(c.timers.size,timers);
});
test('campos ocultos não vazam por quantity, detalhes de variável ou sprite após mudança do mundo',()=>{
 const m=mission(21),start=initialState(m),known=simulate(m,m.solution).find(s=>s.lastEvent==='inspected');const after={...known,variables:{...known.variables,cor:'azul'}};assert.equal(resolveScene(m,after).entities[0].asset.id,'reactive/lock_red');
 m.presentation.visual.entities.fechadura.details=[{source:'variable',name:'cor'}];assert.deepEqual(resolveScene(m,start).entities[0].details,['?']);assert.deepEqual(resolveScene(m,after).entities[0].details,['vermelho']);
 const n=mission(30);n.presentation.visual.entities.pilha.observedProperties={quantidade:'quantidadeObservada'};assert.equal(resolveScene(n,initialState(n)).entities[0].quantity,undefined);const observed=applyCommand(n,initialState(n),n.solution[0]);assert.equal(resolveScene(n,observed).entities[0].quantity,1);
});
test('prévia de cenário inicialmente na meta não emite aparência de vitória',()=>{
 const m=mission(1);m.goal={...m.start};const p=variantPreview(missionVariants(m),0);assert.equal(p.state.status,'ready');assert.doesNotMatch(p.html,/ak-mood-celebrate|ak-result|ak-fx/);
});
test('última missão concluída carrega sem reexecutar programa e prefixo salvo inconsistente não dá saltos',async()=>{
 const all=await gameController({storage:seeded(33)});assert.equal(all.get().mission.id,33);assert.deepEqual(all.get().program,[]);assert.equal(all.element('#next-mission').hidden,true);const storage=memoryStorage();storage.setItem(PROGRESS_KEY,JSON.stringify({format:PROGRESS_KEY,completedMissionIds:[1,3,3,999]}));const c=await gameController({storage});assert.deepEqual(c.get().completed,[1]);assert.equal(c.get().mission.id,2);const before=c.get();select(c,4);assert.deepEqual(c.get(),before);
});
test('todos os 91 SVGs anteriores permanecem byte a byte e auditoria contém os 71 cenários reais',()=>{
 assert.equal(Object.keys(baseline.assets).length,91);for(const [file,digest]of Object.entries(baseline.assets))assert.equal(createHash('sha256').update(readFileSync(new URL('../'+file,import.meta.url))).digest('hex'),digest);
 const audit=readFileSync(new URL('../docs/V093-MAP-IDENTIFICATION-AUDIT.md',import.meta.url),'utf8');for(const m of missions)for(const s of missionVariants(m))assert(audit.includes(`| ${m.id} · ${m.title} / ${s.variantId} · ${s.variantLabel} |`));assert.match(audit,/232 recursos/);
});
test('prévia respeita dimensões não quadradas sem fixar grade 5×5',()=>{
 const m=mission(1);m.grid={width:3,height:4,obstacles:[]};m.start={row:3,col:0,direction:'L'};m.goal={row:3,col:2};m.solution=seq('AA');const p=variantPreview(missionVariants(m),0);assert.equal(p.width,3);assert.equal(p.height,4);assert.equal((p.html.match(/class="cell /g)??[]).length,12);assert.match(p.label,/3 por 4/);assert.equal(end(m).status,'won');
});
