import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile,cp,mkdtemp,rm,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {execFileSync} from 'node:child_process';
import {missions,missionVariants} from '../src/missions.js';
import {initialState,simulate,validateMission} from '../src/engine.js';
import {newMission,createDraft,transact,undo,redo,place,resize,addVariant,inheritField,resolved,at,assign,renameDeclaration,dependencies,removeAt} from '../src/studio/model.js';
import {diagnose} from '../src/studio/validation.js';
import {parseMission,serializeMission,filename,MAX_IMPORT_BYTES,downloadMission} from '../src/studio/io.js';
import {localDraftStorage} from '../src/studio/draft-storage.js';
import {createPlaytest,stepPlaytest,interruptPlaytest,referenceValidated,testState} from '../src/studio/playtest.js';
import {addSolution} from '../src/studio/program-editor.js';
import {renderInspector,readTyped,defaultForItem} from '../src/studio/inspectors.js';
import {schemaAt,defaultValue} from '../src/studio/authoring-schema.js';
import {renderAuthorBoard} from '../src/studio/board-editor.js';
import {mountStudio} from '../src/studio/app.js';
const freeze=value=>{if(value&&typeof value==='object'){Object.values(value).forEach(freeze);Object.freeze(value);}return value;};
const simple=()=>({...newMission(),solution:Array.from({length:3},()=>({type:'move'}))});
const end=m=>simulate(m,m.solution).at(-1);
function finish(t){let guard=0;while(!t.done){assert(++guard<30000);t=stepPlaytest(t);}return t;}
const text=file=>readFile(new URL('../'+file,import.meta.url),'utf8');
function reactive(){const m=simple();m.id='studio-reativa';m.initialVariables={liberada:false};m.entities=[{id:'controle',row:4,col:1,collectible:false,onEnter:[],interactions:[{id:'acionar',relativeTo:['front'],once:true,effects:[{type:'set',variable:'liberada',value:true}]}]}];m.barriers=[{id:'porta',row:4,col:2,passableWhen:{type:'stateEquals',variable:'liberada',value:true}}];const node={type:'interact',relativeTo:'front',entityId:'controle',actionId:'acionar'};m.commandOptions=[{id:'acionar',label:'Ativar dispositivo',node}];m.solution=[node,...m.solution];m.presentation.visual={chapter:'reactive',robotSkin:'mk3',environmentTheme:'yard',entities:{controle:{assetGroup:'button',state:{source:'variable',name:'liberada',values:[{value:true,state:'on'},{value:false,state:'off'}]}}},barrierDefaults:{assetGroup:'door'}};return m;}
test('missão simples: criar, validar, exportar, importar e testar sem mudar tipos/AST',()=>{
 const m=freeze(simple()),serialized=serializeMission(m),n=parseMission(serialized);assert.deepEqual(n,m);assert.equal(serializeMission(n),serialized);assert.equal(end(n).status,'won');assert.equal(referenceValidated(finish(createPlaytest(n)),n),true);assert.equal(diagnose(newMission()).valid,true);assert.throws(()=>createPlaytest(newMission()));
});
test('mapa imutável: colocar, selecionar, mover, remover, desfazer/refazer e conflitos',()=>{
 const original=freeze(createDraft()),painted=transact(original,m=>place(m,-1,'obstacle',2,2));assert.equal(original.mission.grid.obstacles.length,0);assert.equal(painted.mission.grid.obstacles.length,1);assert.equal(transact(painted,m=>place(m,-1,'obstacle',2,2)),painted);
 assert.throws(()=>transact(painted,m=>place(m,-1,'start',2,2)));assert.deepEqual(undo(painted).mission,original.mission);assert.deepEqual(redo(undo(painted)).mission,painted.mission);
 const entity=transact(painted,m=>place(m,-1,'entity',4,1));const moved=transact(entity,m=>place(m,-1,'move',3,1,['entities',0]));assert.equal(moved.mission.entities[0].row,3);assert.equal(entity.mission.entities[0].row,4);assert.throws(()=>transact(moved,m=>removeAt(m,['entities',0])));const removed=transact(moved,m=>removeAt(m,['entities',0],true));assert.equal(removed.mission.entities.length,0);
});
test('mapa permite coabitação de entidades/barreira/sensor e resize com confirmação',()=>{
 const m=newMission();place(m,-1,'entity',3,1);place(m,-1,'collectible',3,1);place(m,-1,'barrier',3,1);place(m,-1,'sensor',3,1);assert.equal(m.entities.length,2);assert.equal(validateMission(m),true);assert.throws(()=>resize(m,-1,3,3));resize(m,-1,3,3,true);assert.equal(m.entities.length,0);assert.equal(m.barriers.length,0);assert.equal(m.grid.cells.length,0);assert.equal(m.start.row,2);assert.throws(()=>resize(m,-1,13,3));
});
test('variantes usam overrides superficiais completos; herança reversível e isolamento',()=>{
 const m=simple();addVariant(m);addVariant(m,0);const before=structuredClone(m.grid);place(m,1,'obstacle',1,1);assert.deepEqual(m.grid,before);assert.equal(m.variants[0].grid,undefined);assert.equal(m.variants[1].grid.width,5);assert.equal(m.variants[1].grid.height,5);assert.equal(m.variants[1].grid.obstacles.length,1);assert.equal(resolved(m,0).grid.obstacles.length,0);inheritField(m,1,'grid');assert.deepEqual(resolved(m,1).grid,before);assert.deepEqual(parseMission(serializeMission(m)),m);const baseTest=createPlaytest(m,{all:false,scenario:-1});assert.equal(baseTest.scenarios[0].variantId,'base');assert.deepEqual(baseTest.scenarios[0].grid,m.grid);assert.equal(referenceValidated(finish(baseTest),m),false);
});
test('declarações: nomes válidos, renomeação bloqueada por dependências e idempotência',()=>{
 const m=reactive();assert(dependencies(m,'liberada').length>=2);assert.throws(()=>renameDeclaration(m,'initialVariables','liberada','aberta'),/Renomeação bloqueada/);assert.throws(()=>removeAt(m,['initialVariables','liberada'],true));assert.throws(()=>renameDeclaration(m,'initialVariables','liberada','constructor'));
 m.initialVariables.livre=0;renameDeclaration(m,'initialVariables','livre','novo');assert.equal(m.initialVariables.novo,0);renameDeclaration(m,'initialVariables','novo','novo');assert.equal(m.initialVariables.novo,0);
});
test('efeitos/interação/barreira reativa e snapshot de playtest isolado do rascunho',()=>{
 const m=freeze(reactive()),t=finish(createPlaytest(m));assert.equal(t.reports[0].status,'won');assert.equal(t.reports[0].instructions,4);assert.equal(m.initialVariables.liberada,false);assert.equal(end({...m,solution:m.solution.slice(1)}).status,'collision');assert.equal(referenceValidated(t,{...m,title:'Editado'}),false);assert.equal(referenceValidated(t,m),true);
});
for(const id of [13,14,15,16,17,18,19,20,21,22,23,24,25])test(`round-trip avançado ${id}: mesmas variantes, propriedades, permissões e resultados`,()=>{
 const m=missions.find(m=>m.id===id),before=structuredClone(m),n=parseMission(serializeMission(m));assert.deepEqual(n,before);
 const a=missionVariants(m),b=missionVariants(n);assert.equal(a.length,b.length);for(let i=0;i<a.length;i++)assert.deepEqual(simulate(a[i],m.solution),simulate(b[i],n.solution));const result=finish(createPlaytest(n));assert.equal(referenceValidated(result,n),true);
});
test('tipos false/0/texto vazio/null/front/here e envelope explícito preservados',async()=>{
 const m=JSON.parse(await text('docs/V04-example.json'));const n=parseMission(serializeMission(m));assert.deepEqual(n,m);const envelope=JSON.stringify({format:'mission-json',version:1,mission:m});assert.deepEqual(parseMission(envelope),m);assert.throws(()=>parseMission(JSON.stringify({format:'mission-json',version:2,mission:m})));assert.throws(()=>parseMission(JSON.stringify({format:'mission-json',version:1,mission:m,grid:{}})));
 assert.equal(readTyped('boolean','false'),false);assert.equal(readTyped('number','0'),0);assert.equal(readTyped('string',''),'');assert.throws(()=>readTyped('number',''));assert.throws(()=>readTyped('number','Infinity'));
});
for(const mutate of [m=>m.grid.obstacles=[{row:4,col:0}],m=>m.entities=[{id:'x',row:1,col:1,collectible:true,onEnter:[]},{id:'x',row:2,col:1,collectible:true,onEnter:[]}],m=>m.solution=[{type:'interact',relativeTo:'front',actionId:'x'}],m=>m.presentation.visual.environmentTheme='https://evil.invalid/x',m=>m.presentation.visual.src='https://evil.invalid/x',m=>m.grid.width=100000,m=>m.loopOptions={},m=>m.schoolId='school',m=>m.entities=[null],m=>m.variants=[{id:'bad',status:'won'}]])test('importação inválida não passa por validador da engine/segurança do Studio',()=>{
 const m=simple();mutate(m);assert.throws(()=>parseMission(JSON.stringify(m)));assert.equal(diagnose(m).valid,false);
});
test('hostilidade: limite antes do parse, proto pollution, profundidade, getters e texto escapado',()=>{
 assert.throws(()=>parseMission(' '.repeat(MAX_IMPORT_BYTES+1)));for(const t of ['null','[]','{"__proto__":{}}','{"constructor":{}}','{'])assert.throws(()=>parseMission(t));
 const m=simple();m.title='<script>alert(1)</script>';const parsed=parseMission(serializeMission(m));assert(!renderInspector(parsed,[]).includes('<script>'));const deep={};let child=deep;for(let i=0;i<50;i++){child.next={};child=child.next;}assert.equal(diagnose(deep).valid,false);
 let called=false;const getter=simple();Object.defineProperty(getter,'grid',{enumerable:true,get(){called=true;return {};}});assert.equal(diagnose(getter).valid,false);assert.equal(called,false);assert.throws(()=>assign(m,['__proto__','x'],1));
});
test('inspector estruturado: condições por contexto, propriedades e tipos, sem JSON editável',()=>{
 const m=reactive();m.barriers[0].passableWhen={type:'numberCompare',left:{kind:'worldVariable',name:'collectedCount'},operator:'gte',right:{kind:'literal',value:1}};
 const schema=schemaAt(m,['barriers',0,'passableWhen']);assert(!Object.hasOwn(schema.choices,'pathClear'));assert(!Object.hasOwn(schema.choices,'memoryEquals'));assert(Object.hasOwn(schema.choices,'all'));
 const operand=schemaAt(m,['barriers',0,'passableWhen','left']);assert(!Object.hasOwn(operand.choices,'memoryVariable'));assert(Object.hasOwn(operand.choices,'barrierProperty'));
 const html=renderInspector(m,['barriers',0,'passableWhen']);assert(html.includes('data-union'));assert(!html.includes('<textarea'));m.entities[0].properties={valor:0};assert(renderInspector(m,['entities',0,'properties']).includes('data-value-type'));
});
test('todas as variantes são testadas mesmo após falha; estados stalled/limit/unknown/interrupção',()=>{
 const m=simple();m.variants=[{id:'ok'},{id:'bloqueada',grid:{width:5,height:5,obstacles:[{row:4,col:2}]}},{id:'ok-final'}];const t=finish(createPlaytest(m));assert.deepEqual(t.reports.map(r=>r.status),['won','collision','won']);assert.equal(referenceValidated(t,m),false);
 const loop={...newMission(),initialVariables:{open:true},loopOptions:[{id:'loop',label:'Aberto?',kind:'while',condition:{type:'stateEquals',variable:'open',value:true}}],solution:[{type:'while',condition:{type:'stateEquals',variable:'open',value:true},body:[]}]};assert.equal(finish(createPlaytest(loop)).reports[0].status,'stalled');assert.equal(finish(createPlaytest(loop,{instructionLimit:1})).reports[0].status,'limit');
 const memory=structuredClone(missions.find(m=>m.id===22));memory.solution=memory.solution.slice(1);assert.equal(finish(createPlaytest(memory)).reports[0].reason,'memoryUnknown');
 const begun=stepPlaytest(createPlaytest(simple())),stopped=interruptPlaytest(begun);assert.equal(testState(stopped).status,'stopped');assert.equal(stopped.done,true);assert.equal(stepPlaytest(stopped),stopped);assert.equal(testState(begun).status,'running');assert.equal(stopped.reports[0].instructions,1);
});
test('rascunho local versionado, indisponibilidade e quota não impedem exportação',()=>{
 const map=new Map(),storage=localDraftStorage(()=>({setItem:(k,v)=>map.set(k,v),getItem:k=>map.get(k),removeItem:k=>map.delete(k)})),m=simple();assert(storage.save(m).ok);assert.deepEqual(storage.load().mission,m);assert(storage.clear().ok);assert.equal(storage.load().mission,null);
 const failed=localDraftStorage(()=>{throw new Error('Bloqueado');});assert.equal(failed.save(m).ok,false);assert.equal(failed.load().ok,false);assert.equal(failed.clear().ok,false);assert.equal(parseMission(serializeMission(m)).id,m.id);assert(!filename({id:'../../<script>'}).includes('/'));
});
// DOM mínimo e relógio controlado: exerce handlers reais, sem alegar pixels/UX real.
function studioHarness({brokenStorage=false}={}){
 const elements=new Map(),listeners=new Map(),timers=new Map();let serial=0;
 const element=selector=>{
  if(!elements.has(selector))elements.set(selector,{dataset:{},value:'',checked:false,disabled:false,hidden:false,innerHTML:'',textContent:'',style:{setProperty(){}},setAttribute(){},focus(){},querySelector(){return null;}});
  return elements.get(selector);
 };
 const document={activeElement:null,querySelector:element,querySelectorAll:()=>[],addEventListener(type,fn){const list=listeners.get(type)??[];list.push(fn);listeners.set(type,list);}};
 const saved=new Map(),storage=localDraftStorage(()=>{if(brokenStorage)throw new Error('Storage bloqueado');return {getItem:key=>saved.get(key),setItem:(key,value)=>saved.set(key,value),removeItem:key=>saved.delete(key)};});
 let exported=null;const app=mountStudio(document,{storage,confirm:()=>true,download:mission=>{exported=serializeMission(mission);},setTimeout:fn=>{timers.set(++serial,fn);return serial;},clearTimeout:id=>timers.delete(id)});
 function dispatch(type,dataset={},value=''){
  const target={dataset,value,disabled:false,closest(selector){if(selector==='button')return this;if(selector==='#program'&&dataset.target!==undefined)return this;return null;}};
  for(const fn of listeners.get(type)??[])fn({target});
 }
 return {app,element,timers,saved,exported:()=>exported,click:(dataset)=>dispatch('click',dataset),change:(dataset,value)=>dispatch('change',dataset,value),next(){const [id,fn]=timers.entries().next().value??[];if(fn){timers.delete(id);fn();}},field(pointer,key){element('#new-field').value=key;dispatch('click',{addField:JSON.stringify(pointer)});},item(pointer){dispatch('click',{addItem:JSON.stringify(pointer)});},value(pointer,type,value){dispatch('change',{value:JSON.stringify(pointer),kind:type},value);},valueType(pointer,type){dispatch('change',{valueType:JSON.stringify(pointer)},type);},union(pointer,type){dispatch('change',{union:JSON.stringify(pointer)},type);}};
}
test('controlador: missão simples criada por botões, selo, exportação/importação e autosave',()=>{
 const c=studioHarness({brokenStorage:true});for(let i=0;i<3;i++)c.click({solutionAdd:'move'});assert.equal(c.app.getDraft().mission.solution.length,3);c.element('#instruction-limit').value='1000';c.element('#test-all').onclick();while(c.timers.size)c.next();assert(referenceValidated(c.app.getTest(),c.app.getDraft().mission));assert(c.element('#test-result').innerHTML.includes('Missão concluída!'));assert(c.element('#test-board').innerHTML.includes('success-burst'));c.element('#export').onclick();assert.equal(end(parseMission(c.exported())).status,'won');assert.match(c.element('#storage-status').textContent,/memória/);
 c.value(['title'],'string','Mudou');assert.equal(c.app.getTest(),null);assert(!c.element('#test-report').innerHTML.includes('Solução de referência validada'));
 const imported=studioHarness();imported.app.importText(c.exported());assert.equal(imported.app.getDraft().mission.solution.length,3);assert.equal(imported.saved.size,1);
});
test('controlador: regras reativas criadas em formulários, sem editar JSON ou JS',async()=>{
 const c=studioHarness();c.element('#advanced').checked=true;
 c.field([],'initialVariables');c.element('#new-key').value='liberada';c.click({addKey:'["initialVariables"]'});c.valueType(['initialVariables','liberada'],'boolean');
 c.element('#tool').value='entity';c.element('#board').onclick({target:{dataset:{row:'4',col:'1'},closest(){return this;}}});
 c.field(['entities',0],'interactions');c.item(['entities',0,'interactions']);c.item(['entities',0,'interactions',0,'relativeTo']);c.item(['entities',0,'interactions',0,'effects']);c.value(['entities',0,'interactions',0,'effects',0,'variable'],'string','liberada');c.valueType(['entities',0,'interactions',0,'effects',0,'value'],'boolean');c.value(['entities',0,'interactions',0,'effects',0,'value'],'boolean','true');
 c.element('#tool').value='barrier';c.element('#board').onclick({target:{dataset:{row:'4',col:'2'},closest(){return this;}}});c.union(['barriers',0,'passableWhen'],'stateEquals');
 c.field([],'commandOptions');c.item(['commandOptions']);c.union(['commandOptions',0,'node'],'interact');c.click({solutionAdd:'command:comando'});for(let i=0;i<3;i++)c.click({solutionAdd:'move'});
 c.value(['id'],'string','studio-reativa');c.value(['title'],'string','Controle e passagem');c.value(['presentation','visual','chapter'],'string','reactive');c.value(['presentation','visual','robotSkin'],'string','mk3');c.value(['presentation','visual','environmentTheme'],'string','yard');
 c.field(['presentation','visual'],'entities');c.element('#new-key').value='objeto1';c.click({addKey:'["presentation","visual","entities"]'});c.field(['presentation','visual','entities','objeto1'],'state');c.valueType(['presentation','visual','entities','objeto1','state'],'selector');c.field(['presentation','visual'],'barrierDefaults');
 c.element('#add-variant').onclick();c.element('#add-variant').onclick();c.click({override:'1',field:'initialVariables'});c.value(['variants',1,'initialVariables','liberada'],'boolean','true');c.value(['variants',0,'label'],'string','Treino: passagem fechada');c.value(['variants',1,'label'],'string','Teste: passagem já liberada');
 const m=c.app.getDraft().mission;assert.deepEqual(m,JSON.parse(await text('docs/V09-example.json')));assert.equal(diagnose(m).valid,true,JSON.stringify(diagnose(m)));assert.equal(m.entities[0].interactions[0].effects[0].value,true);assert.equal(end(m).status,'won');assert.equal(m.initialVariables.liberada,false);assert.equal(end({...m,solution:m.solution.slice(1)}).status,'collision');assert.equal(end(parseMission(serializeMission(m))).status,'won');
});
test('controlador: variante não altera base, desfazer/refazer, timer cancelado e importação hostil atômica',()=>{
 const c=studioHarness();c.element('#add-variant').onclick();c.element('#scenario').value='0';c.element('#scenario').onchange();c.element('#tool').value='obstacle';c.element('#board').onclick({target:{dataset:{row:'1',col:'1'},closest(){return this;}}});assert.equal(c.app.getDraft().mission.grid.obstacles.length,0);assert.equal(c.app.getDraft().mission.variants[0].grid.obstacles.length,1);
 c.element('#undo').onclick();assert.equal(c.app.getDraft().mission.variants[0].grid,undefined);c.element('#redo').onclick();assert.equal(c.app.getDraft().mission.variants[0].grid.obstacles.length,1);
 for(let i=0;i<3;i++)c.click({solutionAdd:'move'});c.element('#instruction-limit').value='1000';c.element('#test-all').onclick();const stale=[...c.timers.values()][0],pointer=testState(c.app.getTest()).instructionPointer;c.element('#stop').onclick();assert.equal(c.timers.size,0);stale();assert.equal(testState(c.app.getTest()).instructionPointer,pointer);assert.equal(c.app.getTest().interrupted,true);
 const before=c.app.getDraft();assert.throws(()=>c.app.importText('{"__proto__":{}}'));assert.deepEqual(c.app.getDraft(),before);
});
test('controlador: cópia de modelo preserva visual portátil sem alterar catálogo',()=>{
 const c=studioHarness(),source=structuredClone(missions.find(m=>m.id===13));c.element('#template').value='13';c.element('#template').onchange();assert.equal(c.app.getDraft().mission.id,'studio-copia-13');assert.equal(c.app.getDraft().mission.presentation.visual.environmentTheme,'yard');assert.deepEqual(missions.find(m=>m.id===13),source);
});
test('artefato publica somente a entrada adicional studio/index.html, com referências relativas',async()=>{
 const temp=await mkdtemp(join(tmpdir(),'algo-studio-'));
 try{await cp('src',join(temp,'src'),{recursive:true});await cp('studio',join(temp,'studio'),{recursive:true});await cp('index.html',join(temp,'index.html'));const validate=()=>execFileSync(process.execPath,['scripts/validate-dist.js',temp],{stdio:'pipe'});validate();await writeFile(join(temp,'studio/evil.html'),'<html></html>');assert.throws(validate);await rm(join(temp,'studio/evil.html'));await writeFile(join(temp,'studio/index.html'),'<script src="/src/studio/app.js"></script>');assert.throws(validate);}finally{await rm(temp,{recursive:true,force:true});}
});
test('controlador: while com duas variantes, corpos editados por blocos e overrides integrais',()=>{
 const c=studioHarness();c.element('#advanced').checked=true;c.element('#tool').value='goal';c.element('#board').onclick({target:{dataset:{row:'3',col:'2'},closest(){return this;}}});c.element('#tool').value='obstacle';c.element('#board').onclick({target:{dataset:{row:'4',col:'3'},closest(){return this;}}});
 c.field([],'loopOptions');c.item(['loopOptions']);c.union(['loopOptions',0],'while');c.click({solutionAdd:'loop:enquanto'});c.click({target:'0.body'});c.click({solutionAdd:'move'});c.element('#program-root').onclick();c.click({solutionAdd:'turnLeft'});c.click({solutionAdd:'move'});
 c.element('#add-variant').onclick();c.element('#add-variant').onclick();c.click({override:'1',field:'grid'});c.value(['variants',1,'grid','obstacles',0,'col'],'number','4');c.click({override:'1',field:'goal'});c.value(['variants',1,'goal','col'],'number','3');
 const m=c.app.getDraft().mission;assert.equal(m.solution[0].body.length,1);assert.equal(m.grid.obstacles[0].col,3);assert.equal(m.variants[1].grid.width,5);assert.equal(m.variants[1].grid.obstacles[0].col,4);assert.equal(diagnose(m).valid,true);const t=finish(createPlaytest(parseMission(serializeMission(m))));assert.deepEqual(t.reports.map(r=>r.instructions),[7,9]);assert(referenceValidated(t,m));
});
test('download usa Blob de JSON puro, nome seguro e revoga URL temporária',async()=>{
 let blob,clicked=false,removed=false,revoked=false,revoke;const link={click(){clicked=true;},remove(){removed=true;}},document={body:{append(item){assert.equal(item,link);}},createElement(){return link;}};
 downloadMission(simple(),document,{createObjectURL(value){blob=value;return 'blob:local';},revokeObjectURL(url){assert.equal(url,'blob:local');revoked=true;}},fn=>{revoke=fn;});assert(clicked&&removed);assert.equal(link.download,'studio-missao.json');assert.equal(blob.type,'application/json');assert.deepEqual(parseMission(await blob.text()),simple());assert.equal(revoked,false);revoke();assert.equal(revoked,true);
});
test('controlador: pausa mantém estado, passo avança e edição invalida selo e callback antigo',()=>{
 const c=studioHarness();for(let i=0;i<3;i++)c.click({solutionAdd:'move'});c.element('#instruction-limit').value='1000';c.element('#test-all').onclick();c.element('#pause').onclick();const paused=c.app.getTest();assert.equal(c.timers.size,0);assert.equal(testState(paused).status,'running');c.element('#step').onclick();assert.equal(testState(c.app.getTest()).instructionPointer,2);c.element('#pause').onclick();const stale=[...c.timers.values()][0];c.value(['hint'],'string','Nova dica');assert.equal(c.app.getTest(),null);assert.equal(c.timers.size,0);stale();assert.equal(c.app.getTest(),null);
});
test('controlador: recuperação de permissões inválidas não descarta programa silenciosamente',()=>{
 const c=studioHarness();c.element('#advanced').checked=true;c.field([],'loopOptions');c.item(['loopOptions']);c.click({solutionAdd:'loop:repetir'});c.value(['loopOptions',0,'times'],'number','3');assert.equal(diagnose(c.app.getDraft().mission).valid,false);assert(c.element('#program').innerHTML.includes('data-repair-root'));c.click({repairRoot:'0'});assert.equal(c.app.getDraft().mission.solution.length,0);assert.equal(diagnose(c.app.getDraft().mission).valid,true);
});
