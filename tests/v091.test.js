import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {runInThisContext} from 'node:vm';
import {initialState,applyCommand,simulate,terminal,classifyResult,createExecution,stepExecution,interruptExecution} from '../src/engine.js';
import {defaultEnergy,validateEnergy,energyMessage} from '../src/energy.js';
import {semanticSignature} from '../src/loops.js';
import {missions,missionVariants} from '../src/missions.js';
import {newMission,createDraft} from '../src/studio/model.js';
import {serializeDraft,parseDraft,parseMission,serializeMission,downloadDraft} from '../src/mission-io.js';
import {diagnose} from '../src/mission-validation.js';
import {createPlaytest,stepPlaytest,referenceValidated} from '../src/studio/playtest.js';
import {mountStudio} from '../src/studio/app.js';
import {renderEnergy} from '../src/presentation/energy-view.js';
import {resultPresentation} from '../src/presentation/visual-resolver.js';
const move={type:'move'},left={type:'turnLeft'},right={type:'turnRight'};
const seq=text=>[...text].map(c=>({type:{A:'move',E:'turnLeft',D:'turnRight'}[c]}));
const freeze=value=>{if(value&&typeof value==='object'){Object.values(value).forEach(freeze);Object.freeze(value);}return value;};
const basic=()=>({...newMission(),solution:seq('AAA')});
const powered=()=>({...basic(),energy:defaultEnergy()});
const end=(m,p=m.solution,options)=>simulate(m,p,options).at(-1);
function finished(test){while(!test.done)test=stepPlaytest(test);return test;}
function semantic(s){const {row,col,direction,variables,memory,collectedCount,collectedIds,consumedIds,usedInteractions,energyRemaining,energySpent}=s;return {row,col,direction,variables,memory,collectedCount,collectedIds,consumedIds,usedInteractions,energyRemaining,energySpent};}
test('energia opt-in: custo, saldo exato e nenhum campo/indicador nas missões antigas',()=>{
 for(const m of missions){const s=initialState(m);assert(!Object.hasOwn(s,'energyRemaining'));assert.equal(renderEnergy(s),'');}
 for(const initial of [6,7,10]){const m=powered();m.energy.initial=initial;const s=end(m);assert.equal(s.status,'won');assert.equal(s.energySpent,6);assert.equal(s.energyRemaining,initial-6);assert.match(renderEnergy(s),/Energia:/);}
 const m=powered();m.energy.initial=5;const s=end(m);assert.equal(s.status,'energyDepleted');assert.equal(s.instructionPointer,3);assert.equal(s.col,2);assert.equal(s.energyRemaining,1);assert.equal(s.energySpent,4);assert.equal(classifyResult(s),'failure');assert(terminal(s));assert.deepEqual(s.events,[{type:'energyDepleted',action:'move',required:2,remaining:1}]);assert.equal(resultPresentation(s).kind,'energyDepleted');
});
for(const change of [e=>e.initial=0,e=>e.initial=10001,e=>e.initial='10',e=>e.initial=1.2,e=>e.initial=Infinity,e=>e.costs.move=-1,e=>e.costs.move=101,e=>e.costs.move='2',e=>e.costs.move=NaN,e=>e.costs.move=.5,e=>delete e.costs.inspect,e=>e.costs.extra=0,e=>e.extra=1])test('energia rejeita contrato inválido, sem coerção',()=>{
 const m=powered();change(m.energy);assert.throws(()=>initialState(m));assert.equal(diagnose(m).valid,false);
});
test('sem saldo: zero continua válido; insuficiência é atômica antes de coletar/agir/girar',()=>{
 const m=powered();m.energy.initial=1;m.energy.costs.move=1;m.energy.costs.turnLeft=0;m.entities=[{id:'item',row:4,col:2,collectible:true,onEnter:[{type:'increment',variable:'pontos',amount:1}]}];m.initialVariables={pontos:0};let s=applyCommand(m,initialState(m),move);assert.equal(s.energyRemaining,0);s=applyCommand(m,s,left);assert.equal(s.direction,'N');assert.equal(s.status,'running');const before=freeze(s),failed=applyCommand(m,before,right);assert.equal(failed.status,'energyDepleted');assert.deepEqual(semantic(failed),semantic(before));assert.equal(failed.instructionPointer,before.instructionPointer+1);
 const state={...initialState(m),col:1,energyRemaining:0,energySpent:1};const depleted=applyCommand(m,state,move);assert.deepEqual(depleted.collectedIds,[]);assert.equal(depleted.variables.pontos,0);assert.equal(depleted.col,1);
});
test('colisão e ação inválida não cobram; energia suficiente preserva falha original',()=>{
 const m=powered();m.grid.obstacles=[{row:4,col:1}];const before=initialState(m),failed=applyCommand(m,before,move);assert.equal(failed.status,'collision');assert.equal(failed.energyRemaining,10);assert.equal(failed.energySpent,0);
 m.grid.obstacles=[];const interact={type:'interact',actionId:'usar',relativeTo:'front'};m.commandOptions=[{id:'usar',label:'Usar',node:interact}];const action=applyCommand(m,initialState(m),interact);assert.equal(action.status,'actionFailed');assert.equal(action.energySpent,0);
});
test('energia em interact/inspect/setMemory: sucesso cobra e falta não aplica efeito',()=>{
 const m=powered();m.goal={row:0,col:4};m.initialVariables={open:false};m.robotMemory={flag:{type:'boolean',initial:null}};m.grid.cells=[{row:4,col:1,properties:{marca:true}}];m.entities=[{id:'controle',row:4,col:1,collectible:false,onEnter:[],interactions:[{id:'ativar',relativeTo:['front'],consume:true,effects:[{type:'set',variable:'open',value:true}]}]}];
 const commands=[{type:'inspect',source:{type:'cellProperty',relativeTo:'front',property:'marca'},into:'flag'},{type:'setMemory',variable:'flag',value:false},{type:'interact',entityId:'controle',relativeTo:'front',actionId:'ativar'}];m.commandOptions=commands.map((node,i)=>({id:'c'+i,label:'Comando',node}));m.energy.costs.inspect=2;m.energy.costs.setMemory=3;m.energy.costs.interact=4;
 let s=initialState(m);for(const node of commands)s=applyCommand(m,s,node);assert.equal(s.energyRemaining,1);assert.equal(s.energySpent,9);assert.equal(s.variables.open,true);assert.deepEqual(s.consumedIds,['controle']);
 const empty={...initialState(m),energyRemaining:0,energySpent:10};for(const node of commands){const failed=applyCommand(m,empty,node);assert.equal(failed.status,'energyDepleted');assert.deepEqual(semantic(failed),semantic(empty));}
});
test('for/if/switch/while cobram somente ações e energia faz parte do estado semântico',()=>{
 const m=powered();m.goal={row:0,col:4};m.loopOptions=[{id:'four',label:'Quatro',kind:'for',times:4}];const counted=[{type:'for',times:4,body:[move]}];assert.equal(end(m,counted).energySpent,end(m,seq('AAAA')).energySpent);assert.equal(end(m,counted).energySpent,8);
 m.initialVariables={open:true};const condition={type:'stateEquals',variable:'open',value:true};m.loopOptions.push({id:'loop',label:'Aberto?',kind:'while',condition});m.energy.initial=3;const p=[{type:'while',condition,body:[left,right]}];const states=simulate(m,p),last=states.at(-1);assert.equal(last.status,'energyDepleted');assert.equal(last.energyRemaining,0);assert(!states.some(s=>s.status==='stalled'));m.energy.costs.turnLeft=0;m.energy.costs.turnRight=0;assert.equal(end(m,p).status,'stalled');
 const a=initialState(m),b={...a,energyRemaining:2,energySpent:1};assert.notEqual(semanticSignature(a),semanticSignature(b));
 m.switchOptions=[{id:'open',label:'Aberto',selector:{kind:'worldVariable',name:'open'},cases:[{value:true,label:'Sim'},{value:false,label:'Não'}]}];const sw={type:'switch',selector:{kind:'worldVariable',name:'open'},cases:[{value:true,body:[move]},{value:false,body:[]}],default:[]};assert.equal(end(m,[{type:'if',condition:{type:'pathClear'},then:[sw],else:[]}]).energySpent,2);
});
test('energia: passos/simulação/sessões equivalentes; interromper conserva e reset/variantes isolam',()=>{
 const m=powered();m.variants=[{id:'exata',energy:{...defaultEnergy(),initial:6}},{id:'curta',energy:{...defaultEnergy(),initial:5}}];assert.equal(diagnose(m).valid,true);const t=finished(createPlaytest(m));assert.deepEqual(t.reports.map(r=>r.status),['won','energyDepleted']);assert.deepEqual(t.reports.map(r=>r.energyInitial),[6,5]);assert.equal(referenceValidated(t,m),false);assert.equal(initialState(m).energyRemaining,10);
 const scenario=missionVariants(m)[0];let e=freeze(createExecution(scenario,m.solution));const states=[e.state];while(!terminal(e.state)){e=freeze(stepExecution(scenario,m.solution,e));states.push(e.state);}assert.deepEqual(states,simulate(scenario,m.solution));const begun=stepExecution(m,m.solution,createExecution(m,m.solution)),stopped=interruptExecution(begun);assert.equal(stopped.state.energyRemaining,8);assert.equal(stopped.state.energySpent,2);assert.equal(stopped.state.instructionPointer,1);
 const invalid=structuredClone(m);invalid.variants[0].energy={initial:5};assert.equal(diagnose(invalid).valid,false);assert.deepEqual(parseMission(serializeMission(m)),m);
});
test('rascunhos incompletos são portáteis e distintos de missão executável',()=>{
 const draft={id:'parcial',title:'Em construção',grid:{width:5,height:5,obstacles:[]},initialVariables:{zero:0,nao:false,vazio:''},robotMemory:{n:{type:'number',initial:null}},solution:[],entities:[{id:'x'}],variants:[],energy:{initial:'a completar'},presentation:{visual:{robotSkin:'mk1'}}};
 const s=serializeDraft(freeze(draft));assert.deepEqual(parseDraft(s),draft);assert.equal(serializeDraft(parseDraft(s)),s);assert.throws(()=>parseMission(s));assert.throws(()=>serializeMission(draft));
 for(const value of [{format:'algo-kids-draft',version:2,mission:{}},{format:'algo-kids-draft',version:1,mission:[],extra:1},{format:'algo-kids-draft',version:1,mission:{},extra:1}])assert.throws(()=>parseDraft(JSON.stringify(value)));
 assert.throws(()=>parseDraft('{"format":"algo-kids-draft","version":1,"mission":{"__proto__":{}}}'));assert.throws(()=>parseDraft(' '.repeat(1024*1024+1)));
});
test('backup usa Blob local, extensão explícita, nome seguro e URL revogada',async()=>{
 let blob,callback,revoked=false;const link={click(){},remove(){}},doc={body:{append(){}},createElement(){return link;}};downloadDraft({id:'../../rascunho',solution:[]},doc,{createObjectURL(b){blob=b;return 'blob:local';},revokeObjectURL(){revoked=true;}},fn=>callback=fn);assert(link.download.endsWith('.akdraft.json'));assert(!link.download.includes('/'));assert.deepEqual(parseDraft(await blob.text()).solution,[]);callback();assert(revoked);
});
test('Missão 20: bifurcação exata, política 2..3 e uma rota válida por carga',()=>{
 const m=missions.find(m=>m.id===20);assert.deepEqual(m.start,{row:2,col:0,direction:'L'});assert.deepEqual(m.goal,{row:2,col:4});assert.equal(m.grid.obstacles.length,15);assert.deepEqual(m.barriers.map(b=>[b.id,b.row,b.col,b.properties.capacidade]),[['ponte-a',1,2,1],['ponte-b',3,2,3]]);assert.equal(m.solution[0].type,'move');assert.equal(m.solution[1].type,'if');
 for(const [i,v] of missionVariants(m).entries()){assert.deepEqual(v.grid,m.grid);assert.equal(end(v).status,'won');assert.equal(end(v,seq('AEADAADAEA')).status,i===0?'won':'collision');assert.equal(end(v,seq('ADAEAAEADA')).status,i===1?'won':'collision');const wrong=simulate(v,seq(i===0?'ADAEAAEADA':'AEADAADAEA')),failed=wrong.at(-1);assert.deepEqual(semantic(failed),semantic(wrong.at(-2)));}
 const withoutPolicy=structuredClone(m);withoutPolicy.barriers[1].passableWhen=withoutPolicy.barriers[1].passableWhen.conditions[1];assert.equal(end(missionVariants(withoutPolicy)[0],seq('ADAEAAEADA')).status,'won');
 // Toda trajetória de posição até a meta deve cruzar A ou B (busca somente de geometria, sem otimizador).
 const blocked=new Set(m.grid.obstacles.map(p=>`${p.row},${p.col}`));blocked.add('1,2');blocked.add('3,2');const queue=[m.start],seen=new Set();while(queue.length){const p=queue.pop(),key=`${p.row},${p.col}`;if(seen.has(key)||blocked.has(key)||p.row<0||p.col<0||p.row>=5||p.col>=5)continue;seen.add(key);for(const [dr,dc] of [[1,0],[-1,0],[0,1],[0,-1]])queue.push({row:p.row+dr,col:p.col+dc});}assert(!seen.has('2,4'));
});
function studioController(){
 const elements=new Map(),listeners=new Map(),timers=new Map();let next=0,allow=true,exportedDraft=null;const confirmations=[];
 const document={activeElement:null,querySelector:element,querySelectorAll:()=>[],addEventListener(type,fn){const f=listeners.get(type)??[];f.push(fn);listeners.set(type,f);}};
 function element(selector){if(!elements.has(selector))elements.set(selector,{dataset:{},_value:'',get value(){return this._value;},set value(v){this._value=String(v??'');},checked:false,innerHTML:'',textContent:'',hidden:false,disabled:false,style:{setProperty(){}},setAttribute(){},querySelector(){return null;},focus(){document.activeElement=this;}});return elements.get(selector);}
 const storage={save:()=>({ok:false,message:'Somente em memória'}),load:()=>({ok:true,mission:null}),clear:()=>({ok:true})};
 const app=mountStudio(document,{storage,confirm:message=>{confirmations.push(message);return allow;},downloadDraft:m=>exportedDraft=serializeDraft(m),setTimeout:fn=>{timers.set(++next,fn);return next;},clearTimeout:id=>timers.delete(id)});
 function fire(type,dataset,value){const node={dataset,value,disabled:false,closest(selector){if(selector==='button'||selector==='#program')return this;return null;}};document.activeElement=node;for(const fn of listeners.get(type)??[])fn({target:node});}
 return {app,element,timers,confirmations,allow:value=>allow=value,exportedDraft:()=>exportedDraft,click:d=>fire('click',d),change:(d,v)=>fire('change',d,v),deleteRendered(path){const html=element('#program').innerHTML;const match=[...html.matchAll(/<button\b([^>]*data-edit="remove"[^>]*)>([\s\S]*?)<\/button>/g)].find(m=>m[1].includes(`data-path="${path}"`));assert(match,`controle renderizado não encontrado ${path}`);assert.match(match[2],/Excluir/);const dataset=Object.fromEntries([...match[1].matchAll(/data-([a-z-]+)="([^"]*)"/g)].map(([,key,value])=>[key.replace(/-([a-z])/g,(_,x)=>x.toUpperCase()),value]));fire('click',dataset);},next(){const [id,fn]=timers.entries().next().value??[];if(fn){timers.delete(id);fn();}}};
}
function authorMission(){const m=basic();m.goal={row:0,col:4};m.initialVariables={count:0};m.robotMemory={n:{type:'number',initial:0}};m.grid.cells=[{row:4,col:1,properties:{n:1}}];m.entities=[{id:'device',row:4,col:1,collectible:false,onEnter:[],interactions:[{id:'act',relativeTo:['front'],effects:[{type:'increment',variable:'count',amount:1}]}]}];m.commandOptions=[{id:'inspect',label:'Inspecionar',node:{type:'inspect',source:{type:'cellProperty',relativeTo:'front',property:'n'},into:'n'}},{id:'remember',label:'Guardar',node:{type:'setMemory',variable:'n',value:0}},{id:'act',label:'Interagir',node:{type:'interact',relativeTo:'front',entityId:'device',actionId:'act'}}];m.loopOptions=[{id:'two',label:'Duas vezes',kind:'for',times:2},{id:'free',label:'Livre?',kind:'while',condition:{type:'pathClear'}}];m.switchOptions=[{id:'count',label:'Quantidade',selector:{kind:'worldVariable',name:'count'},cases:[{value:0,label:'Zero'},{value:1,label:'Um'}]}];return m;}
const branchPrograms=[
 ['raiz',()=>[move,left,move],'1',[]],
 ['then',()=>[{type:'if',condition:{type:'pathClear'},then:[left,move,right],else:[]}],'0.then.1',[0,'then']],
 ['else',()=>[{type:'if',condition:{type:'pathClear'},then:[],else:[left,move,right]}],'0.else.1',[0,'else']],
 ['case',()=>[{type:'switch',selector:{kind:'worldVariable',name:'count'},cases:[{value:0,body:[]},{value:1,body:[left,move,right]}],default:[]}],'0.cases.1.body.1',[0,'cases',1,'body']],
 ['default',()=>[{type:'switch',selector:{kind:'worldVariable',name:'count'},cases:[{value:0,body:[]},{value:1,body:[]}],default:[left,move,right]}],'0.default.1',[0,'default']],
 ['for',()=>[{type:'for',times:2,body:[left,move,right]}],'0.body.1',[0,'body']],
 ['while',()=>[{type:'while',condition:{type:'pathClear'},body:[left,move,right]}],'0.body.1',[0,'body']]
];
for(const [name,program,path,target] of branchPrograms)test(`Studio exclui pelo botão renderizado em ${name}; undo/redo exatos e destino correto`,()=>{
 const c=studioController(),m=authorMission();m.solution=program();c.app.importText(serializeMission(m));if(target.length)c.click({target:target.join('.')});const before=c.app.getDraft(),destination=c.element('#program-destination').textContent;c.deleteRendered(path);const after=c.app.getDraft();assert.equal(after.revision,before.revision+1);assert.equal(after.past.length,before.past.length+1);assert.equal(c.app.getTest(),null);assert.equal(c.element('#program-destination').textContent,destination);assert.equal((c.element('#program').innerHTML.match(/data-edit="remove"/g)??[]).length,(before.mission.solution[0].type==='move'?3:4)-1);
 c.element('#undo').onclick();assert.deepEqual(c.app.getDraft().mission.solution,before.mission.solution);c.element('#redo').onclick();assert.deepEqual(c.app.getDraft().mission.solution,after.mission.solution);
});
for(const type of ['move','turnLeft','turnRight','inspect','setMemory','interact'])test(`Studio: excluir ação ${type} visível e sem depender de hover`,()=>{
 const m=authorMission(),node=['move','turnLeft','turnRight'].includes(type)?{type}:m.commandOptions.find(o=>o.node.type===type).node;m.solution=[move,node,left];const c=studioController();c.app.importText(serializeMission(m));c.deleteRendered('1');assert.deepEqual(c.app.getDraft().mission.solution,[move,left]);
});
test('Studio confirma quantidade, cancelamento preserva seleção/histórico; estrutura excluída e contexto rebalanceado',()=>{
 const m=authorMission();m.solution=[{type:'for',times:2,body:[move,left]},right];const c=studioController();c.app.importText(serializeMission(m));c.click({target:'0.body'});const snapshot=c.app.getDraft(),destination=c.element('#program-destination').textContent;c.allow(false);c.deleteRendered('0');assert.deepEqual(c.app.getDraft(),snapshot);assert.equal(c.element('#program-destination').textContent,destination);assert.match(c.confirmations.at(-1),/2 comandos internos/);c.allow(true);c.deleteRendered('0');assert.deepEqual(c.app.getDraft().mission.solution,[right]);assert.match(c.element('#program-destination').textContent,/Programa principal/);
});
test('Studio exporta/restaura draft incompleto, sem perder snapshot em erro/cancelamento',()=>{
 const c=studioController();const incomplete={id:'parcial',title:'Ainda incompleta',grid:null,variants:[null],commandOptions:'a configurar',energy:{initial:'depois'},solution:[]};c.app.importDraftText(serializeDraft(incomplete));assert.deepEqual(c.app.getDraft().mission,incomplete);assert(c.element('#export').disabled);c.element('#export-draft').onclick();assert.deepEqual(parseDraft(c.exportedDraft()),incomplete);assert.match(c.element('#diagnostics').innerHTML,/studio-error/);
 const before=c.app.getDraft();c.allow(false);c.app.importDraftText(serializeDraft(basic()));assert.deepEqual(c.app.getDraft(),before);c.allow(true);assert.throws(()=>c.app.importDraftText('{"format":"nope"}'));assert.deepEqual(c.app.getDraft(),before);
});
test('Studio energia e menu: custos completos, variante rasa, saldo no relatório e grupos técnicos visíveis',()=>{
 const c=studioController();c.app.importText(serializeMission(basic()));c.element('#enable-energy').checked=true;c.element('#enable-energy').onchange();assert.deepEqual(c.app.getDraft().mission.energy,defaultEnergy());c.element('#energy-initial').value='6';c.element('#apply-energy').onclick();assert.equal(c.app.getDraft().mission.energy.initial,6);c.element('#instruction-limit').value='1000';c.element('#test-all').onclick();while(c.timers.size)c.next();assert.equal(c.app.getTest().reports[0].energyRemaining,0);assert.match(c.element('#test-report').innerHTML,/6 \/ 6 \/ 0/);assert.match(c.element('#test-energy').innerHTML,/Energia: 0 \/ 6/);
 for(const group of ['Movimento','Decisões','Repetições','Ações e memória'])assert(c.element('#program-tools').innerHTML.includes(group));c.element('#enable-energy').checked=false;c.element('#enable-energy').onchange();assert(!Object.hasOwn(c.app.getDraft().mission,'energy'));
});
async function gameController(){
 const source=await readFile(new URL('../src/ui.js',import.meta.url),'utf8'),bindings={};for(const match of source.matchAll(/^import \{([^}]+)\} from '([^']+)';$/gm)){const module=await import(new URL(match[2],new URL('../src/ui.js',import.meta.url)));for(const name of match[1].split(',').map(s=>s.trim()))bindings[name]=module[name];}
 const elements=new Map(),timers=new Map();let next=0;function element(selector){if(selector.includes(' '))return null;if(!elements.has(selector))elements.set(selector,{dataset:{},innerHTML:'',textContent:'',hidden:false,disabled:false,scrollTop:0,scrollLeft:0,style:{setProperty(){}},setAttribute(){},focus(){}});return elements.get(selector);}
 const env={...bindings,structuredClone,document:{activeElement:null,querySelector:element,querySelectorAll:()=>[]},matchMedia:()=>({matches:true}),window:{confirm:()=>true},setTimeout:fn=>{timers.set(++next,fn);return next;},clearTimeout:id=>timers.delete(id)};
 const run=runInThisContext(`(function(${Object.keys(env).join(',')}){${source.replace(/^import .*;\n/gm,'')};return {get:()=>({mission,program,target,session,imported,completed:[...completed]})};})`),api=run(...Object.values(env));
 const button=dataset=>({dataset,disabled:false,hidden:false,closest(){return this;}});
 return {element,timers,get:()=>structuredClone(api.get()),add:type=>element('.palette').onclick({target:button({add:type})}),addLoop:id=>element('.palette').onclick({target:button({loopOption:id})}),inlineMove:target=>element('#program').onclick({target:button({inlineAdd:'move',target})}),next(){const [id,fn]=timers.entries().next().value??[];if(fn){timers.delete(id);fn();}},async import(mission,name='mission.json'){const text=typeof mission==='string'?mission:serializeMission(mission);await element('#import-mission').onchange({target:{files:[{name,size:new TextEncoder().encode(text).length,text:async()=>text}],value:name}});}};
}
test('jogo: JSON exportado joga sem preencher referência; id não contamina conquistas e saída restaura sessão',async()=>{
 const c=await gameController();for(let i=0;i<3;i++)c.add('move');c.element('#run').onclick();while(c.timers.size)c.next();const official=c.get();assert.deepEqual(official.completed,[1]);const m=powered();m.id=2;m.title='<script>Missão local</script>';m.energy.initial=6;await c.import(m);assert.equal(c.get().imported,true);assert.equal(c.get().mission.id,2);assert.deepEqual(c.get().program,[]);assert.equal(c.element('#mission-number').textContent,'MISSÃO IMPORTADA');for(let i=0;i<3;i++)c.add('move');c.element('#run').onclick();while(c.timers.size)c.next();assert.equal(c.get().session.execution.state.status,'won');assert.deepEqual(c.get().completed,[1]);c.element('#back-missions').onclick();assert.equal(c.get().imported,false);assert.deepEqual(c.get().program,official.program);assert.deepEqual(c.get().session,official.session);
});
test('jogo: variantes importadas usam mesmo programa criado pelos controles reais',async()=>{
 const c=await gameController(),m=structuredClone(missions.find(m=>m.id===25));m.id='studio-corredores';await c.import(m);c.addLoop('livre');c.inlineMove('0.body');c.element('#root-target').onclick();c.add('turnLeft');c.add('move');c.element('#run').onclick();while(c.timers.size)c.next();assert.equal(c.get().session.passed.length,1);c.element('#test-variants').onclick();while(c.timers.size)c.next();assert.equal(c.get().session.completed,true);assert.deepEqual(c.get().completed,[]);
});
test('jogo rejeita draft/envelope hostil sem alterar a missão nem progresso atual',async()=>{
 const c=await gameController(),before=c.get();await c.import(serializeDraft(basic()));assert.deepEqual(c.get(),before);await c.import('{"__proto__":{}}');assert.deepEqual(c.get(),before);await c.import(serializeDraft(basic()),'x.akdraft.json');assert.deepEqual(c.get(),before);await c.import(' '.repeat(1024*1024+1));assert.deepEqual(c.get(),before);
});
test('Studio mantém draft com nós ausentes e tipos temporários; erros não substituem o documento',()=>{
 const c=studioController(),draft={id:{toString:'pendente'},title:'Rascunho',solution:[null],entities:[null],variants:[null],loopOptions:[{id:{toString:'pendente'},label:'A configurar'}]};c.app.importDraftText(serializeDraft(draft));assert.deepEqual(c.app.getDraft().mission,draft);assert.match(c.element('#program').innerHTML,/Bloco incompleto/);c.element('#export-draft').onclick();assert.deepEqual(parseDraft(c.exportedDraft()),draft);
});
test('Studio move/rebalanceia irmãos e preserva inserções consecutivas no corpo',()=>{
 const c=studioController(),m=authorMission();m.solution=[move,{type:'for',times:2,body:[left]}];c.app.importText(serializeMission(m));c.click({target:'1.body'});c.deleteRendered('0');assert.match(c.element('#program-destination').textContent,/CORPO/);c.click({solutionAdd:'move'});c.click({solutionAdd:'move'});assert.deepEqual(c.app.getDraft().mission.solution[0].body,[left,move,move]);c.click({edit:'down',path:'0.body.0'});assert.deepEqual(c.app.getDraft().mission.solution[0].body,[move,left,move]);
});
test('Studio herda e sobrescreve energia por objeto inteiro e pede confirmação para desabilitar',()=>{
 const c=studioController();c.app.importText(serializeMission(powered()));c.element('#add-variant').onclick();c.element('#scenario').value='0';c.element('#scenario').onchange();c.element('#energy-initial').value='6';c.element('#apply-energy').onclick();const m=c.app.getDraft().mission;assert.equal(m.energy.initial,10);assert.equal(m.variants[0].energy.initial,6);assert.deepEqual(m.variants[0].energy.costs,defaultEnergy().costs);c.click({inherit:'0',field:'energy'});assert.equal(c.app.getDraft().mission.variants[0].energy,undefined);assert.equal(c.element('#energy-initial').value,'10');c.element('#scenario').value='-1';c.element('#scenario').onchange();c.allow(false);c.element('#enable-energy').checked=false;c.element('#enable-energy').onchange();assert.deepEqual(c.app.getDraft().mission.energy,defaultEnergy());
});
test('Missão 20 inspeção opcional ocorre somente após se posicionar diante de A',()=>{
 const m=missionVariants(missions.find(m=>m.id===20))[0],node=m.commandOptions[0].node;assert.equal(applyCommand(m,initialState(m),node).status,'actionFailed');let s=initialState(m);for(const command of seq('AEAD'))s=applyCommand(m,s,command);const observed=applyCommand(m,s,node);assert.equal(observed.memory.limiteDaPonte.value,1);assert.equal(observed.row,1);assert.equal(observed.col,1);assert.equal(observed.direction,'L');assert.equal(end(m).status,'won');
});
test('energia: inspeção falha não cobra, memória desconhecida em decisão é gratuita e limite tem prioridade',()=>{
 const m=powered();m.robotMemory={n:{type:'number',initial:null}};const inspect={type:'inspect',source:{type:'cellProperty',relativeTo:'front',property:'ausente'},into:'n'};m.commandOptions=[{id:'read',label:'Ler',node:inspect}];m.energy.costs.inspect=3;const failed=applyCommand(m,initialState(m),inspect);assert.equal(failed.reason,'propertyMissing');assert.equal(failed.energySpent,0);
 const condition={type:'memoryEquals',variable:'n',value:0};m.conditionOptions=[{id:'unknown',label:'Já sei?',condition}];const s=end(m,[{type:'if',condition,then:[move],else:[]}]);assert.equal(s.reason,'memoryUnknown');assert.equal(s.energyRemaining,10);assert.equal(s.energySpent,0);
 const limited=end(m,[left,move],{instructionLimit:1});assert.equal(limited.status,'limit');assert.equal(limited.energyRemaining,9);
 let invoked=false;const energy=defaultEnergy();Object.defineProperty(energy,'initial',{enumerable:true,get(){invoked=true;return 10;}});assert.throws(()=>validateEnergy(energy));assert.equal(invoked,false);
});
