import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {initialState,simulate,createExecution,stepExecution,validateMission,validateProgram,terminal,applyCommand} from '../src/engine.js';
import {createSwitch,validateSwitchNode,evaluateSwitch,validateSwitchOptions,switchHasCommands} from '../src/switches.js';
import {editProgram,countNodes,sequenceAt,encodePath,decodePath,rebaseTarget} from '../src/program.js';
import {nodeAt,sequenceInfo} from '../src/tree.js';
import {renderProgram} from '../src/view.js';
import {renderSwitchPalette,renderDecisionTrace,commandMessages,failureMessage} from '../src/command-view.js';
import {insertionLabel} from '../src/branch-view.js';
import {missions,missionVariants} from '../src/missions.js';
import {createSession,stepSession,canStep,startVariantTests} from '../src/session.js';
const move={type:'move'},right={type:'turnRight'},left={type:'turnLeft'};
const sel=(name='mode',kind='worldVariable')=>({kind,name});
const set=(variable,value)=>({type:'set',variable,value});
const memory=(variable,value)=>({type:'setMemory',variable,value});
const freeze=value=>{if(value&&typeof value==='object'){Object.values(value).forEach(freeze);Object.freeze(value);}return value;};
const end=(m,p,options)=>simulate(m,p,options).at(-1);
const finish=s=>{let guard=0;while(canStep(s)){assert(++guard<2000);s=stepSession(s);}return s;};
function base(type='number',initial=0,values=[0,1,2],kind='worldVariable') {
 const m={grid:{width:5,height:5,obstacles:[]},start:{row:4,col:0,direction:'L'},goal:{row:0,col:4},initialVariables:{mode:initial,flag:false},robotMemory:{},entities:[],switchOptions:[{id:'choose',label:'Escolher usando o valor',selector:sel('mode',kind),cases:values.map((value,i)=>({value,label:`Alternativa ${i+1}`})),defaultLabel:'Outro valor'}]};
 if(kind==='memoryVariable'){m.initialVariables.mode=type==='number'?0:type==='boolean'?false:'';m.robotMemory.mode={type,initial};}
 return m;
}
function built(m){return createSwitch(m,'choose');}
const ifNode=(then=[],otherwise=[])=>({type:'if',condition:{type:'pathClear'},then,else:otherwise});

test('switch emite um evento, escolhe primeiro/segundo/terceiro e não faz fallthrough',()=>{
 for(const initial of [0,1,2]){
  const m=base('number',initial),node=built(m);node.cases[0].body=[move];node.cases[1].body=[right];node.cases[2].body=[left];node.default=[move,move];
  const states=simulate(m,[node]),event=states[1].events[0];assert.deepEqual(event,{type:'switch',selector:sel(),value:initial,selected:{kind:'case',index:initial,value:initial}});assert.equal(states.at(-1).instructionPointer,2);assert.equal(states.length,3);
  assert.equal(states.at(-1).direction,['L','S','N'][initial]);assert.equal(states.at(-1).col,initial===0?1:0);
 }
});
test('valor conhecido sem caso executa default e retoma o pai',()=>{
 const m=base('number',9),node=built(m);node.default=[right];const states=simulate(m,[node,left,move]);assert.deepEqual(states[1].events[0].selected,{kind:'default'});assert.equal(states.at(-1).col,1);assert.equal(states.at(-1).direction,'L');assert.equal(states.at(-1).instructionPointer,4);
});
for(const [type,initial,values] of [['number',0,[0,1]],['boolean',false,[false,true]],['string','',['','outro']]])test(`${type}: ${JSON.stringify(initial)} é conhecido em mundo e memória`,()=>{
 for(const kind of ['worldVariable','memoryVariable']){
  const m=base(type,initial,values,kind),node=built(m);node.cases[0].body=[move];const states=simulate(m,[node]);assert.equal(states.at(-1).col,1);assert.equal(states[1].events[0].selected.index,0);assert.equal(states[1].events[0].value,initial);
 }
});
test('comparação estrita rejeita tipos incompatíveis e não aceita coerção no estado',()=>{
 const m=base(),node=built(m);const forged=structuredClone(node);forged.cases[0].value='0';assert.throws(()=>validateProgram([forged],m));
 let e=createExecution(m,[node]);e={...e,state:{...e.state,variables:{...e.state.variables,mode:'0'}}};const failed=stepExecution(m,[node],e);assert.equal(failed.state.reason,'typeMismatch');assert.equal(failed.state.status,'actionFailed');assert.deepEqual(failed.frames,[]);
 const b=base('boolean',false,[false,true]),bad=built(b);bad.cases[0].value=0;assert.throws(()=>validateProgram([bad],b));
});
test('memória desconhecida não executa default nem publica efeitos e conta a tentativa',()=>{
 const m=base('string',null,['a','b'],'memoryVariable'),node=built(m);node.default=[move];node.cases[0].body=[right];const states=simulate(m,[node]);assert.equal(states.length,2);const last=states.at(-1);assert.equal(last.reason,'memoryUnknown');assert.equal(last.status,'actionFailed');assert.equal(last.instructionPointer,1);assert.equal(last.col,0);assert.equal(last.direction,'L');assert.deepEqual(last.variables,states[0].variables);assert.equal(last.events[0].action,'switch');assert.match(renderDecisionTrace(m,last),/padrão também não foi executado/);assert.match(failureMessage(m,last),/descubra e guarde/);
});
test('seletor é snapshot e mudança no mundo dentro do caso não troca o ramo',()=>{
 const m=base();m.entities=[{id:'control',row:4,col:1,collectible:false,onEnter:[],interactions:[{id:'change',relativeTo:['front'],effects:[set('mode',1)]}]}];const action={type:'interact',relativeTo:'front',actionId:'change'};m.commandOptions=[{id:'change',label:'Alterar o valor',node:action}];
 const node=built(m);node.cases[0].body=[action,move];node.cases[1].body=[right];const states=simulate(m,[node,left]);assert.equal(states[1].events[0].value,0);assert.equal(states.at(-1).variables.mode,1);assert.equal(states.at(-1).col,1);assert.equal(states.at(-1).direction,'N');assert.equal(states.at(-1).instructionPointer,4);
});
test('casos e padrão vazios são decisões únicas e continuam o pai',()=>{
 for(const value of [0,9]){const m=base('number',value),node=built(m);assert.equal(end(m,[node]).instructionPointer,1);assert.equal(end(m,[node]).status,'finished');assert.equal(end(m,[node,move]).col,1);}
});
test('if em switch, switch em if e switch aninhado respeitam retorno e caminhos',()=>{
 const m=base(),outer=built(m),inner=built(m);inner.cases[0].body=[move];outer.cases[0].body=[ifNode([inner]),right];const p=[ifNode([outer]),left];
 let e=freeze(createExecution(m,p));const paths=[];while(!terminal(e.state)){e=freeze(stepExecution(m,p,e));paths.push(e.activePath);}
 assert.equal(e.state.col,1);assert.equal(e.state.direction,'L');assert.equal(e.state.instructionPointer,7);assert(paths.some(path=>JSON.stringify(path)==='[0,"then",0,"cases",0,"body",0,"then",0,"cases",0,"body",0]'));assert.deepEqual(e.state,end(m,p));
});
test('autorização rejeita casos ausentes/extras, duplicados, ordem alterada e default ausente',()=>{
 const m=base();
 for(const change of [n=>n.cases.pop(),n=>n.cases.push({value:3,body:[]}),n=>n.cases[1].value=0,n=>n.cases.reverse(),n=>delete n.default,n=>n.default=null,n=>n.cases[0].body={},n=>n.selector.name='missing',n=>n.selector.kind='literal',n=>n.selector={kind:'worldVariable',name:'constructor'},n=>n.optionId='choose',n=>n.cases[0].label='texto']){const node=built(m);change(node);assert.throws(()=>createExecution(m,[node]));}
 assert.throws(()=>createExecution({...m,switchOptions:[]},[built(m)]));assert.throws(()=>createExecution(missions[0],[built(m)]));assert.throws(()=>applyCommand(missions[0],initialState(missions[0]),built(m)));assert.throws(()=>editProgram([],{type:'add',nodeType:'switch'}));
});
test('configuração limita opções, casos, escalares e seletores ambíguos',()=>{
 for(const change of [m=>m.switchOptions[0].cases=[{value:0,label:'Zero'}],m=>m.switchOptions[0].cases=Array.from({length:9},(_,i)=>({value:i,label:String(i)})),m=>m.switchOptions[0].cases[1].value=0,m=>m.switchOptions[0].cases[1].value=NaN,m=>m.switchOptions[0].cases[1].value=Infinity,m=>m.switchOptions[0].cases[1].value='1',m=>m.switchOptions.push({...structuredClone(m.switchOptions[0]),id:'other'}),m=>m.switchOptions[0].selector={kind:'barrierProperty',name:'x'},m=>m.switchOptions[0].selector={kind:'worldVariable',name:'flag'}]){const m=base();change(m);assert.throws(()=>validateMission(m));}
 const text=base('string','a',['a','b']);text.switchOptions[0].cases[1].value='x'.repeat(129);assert.throws(()=>validateMission(text));
 const tooMany=base();tooMany.switchOptions=Array.from({length:21},(_,i)=>({...structuredClone(tooMany.switchOptions[0]),id:'s'+i}));assert.throws(()=>validateSwitchOptions(tooMany));
});
test('collectedCount é um seletor numérico autorizado',()=>{
 const m=base();m.switchOptions[0].selector=sel('collectedCount');const node=built(m);node.cases[0].body=[move];assert.equal(end(m,[node]).col,1);
});
test('opções sem switch não mudam permissões antigas e valores/memória das variantes são compatíveis',()=>{
 assert.equal(validateMission({...missions[0],switchOptions:[]}),true);assert.equal(renderSwitchPalette(missions[0]),'');
 const m=base();m.variants=[{id:'a',label:'A'},{id:'b',label:'B',switchOptions:[]}];assert.throws(()=>validateMission(m));assert.throws(()=>createSession(m,[built(m)]));
 const callbacks=base();callbacks.switchOptions[0].label=()=>1;assert.throws(()=>createSwitch(callbacks,'choose'));
 let called=false;const getter=base();Object.defineProperty(getter.switchOptions[0],'selector',{enumerable:true,get(){called=true;return sel();}});assert.throws(()=>createSwitch(getter,'choose'));assert.equal(called,false);
});
test('caminhos de caso/padrão têm roundtrip e rejeitam sintaxe quebrada ou perigosa',()=>{
 for(const path of [[],[0],[0,'then',1],[0,'cases',1,'body'],[0,'default'],[0,'cases',0,'body',2,'then',0,'cases',1,'body']])assert.deepEqual(decodePath(encodePath(path)),path);
 for(const encoded of ['0.cases.1','0.body','0.__proto__','-1.then','0.cases.NaN.body','0.cases.1.body..0','00.default','0.default.-1','Infinity'])assert.throws(()=>decodePath(encoded));
 const m=base(),node=built(m);assert.throws(()=>sequenceAt([node],[0,'cases',8,'body']));assert.throws(()=>sequenceAt([move],[0,'default']));assert.throws(()=>sequenceAt([node],[0]));assert.throws(()=>editProgram([node],{type:'remove',path:[0,'cases',0,'body']}));assert.throws(()=>editProgram([node],{type:'remove',path:[0,'cases',0]}));
});
test('edição múltipla em casos e default é imutável e preserva os demais ramos',()=>{
 const m=base(),original=freeze([built(m)]);let p=editProgram(original,{type:'add',nodeType:'move',path:[0,'cases',1,'body'],mission:m});p=editProgram(p,{type:'add',nodeType:'turnLeft',path:[0,'cases',1,'body'],mission:m});p=editProgram(p,{type:'add',nodeType:'turnRight',path:[0,'default'],mission:m});p=editProgram(p,{type:'move',path:[0,'cases',1,'body',1],offset:-1,mission:m});
 assert.deepEqual(p[0].cases[1].body,[left,move]);assert.deepEqual(p[0].default,[right]);assert.deepEqual(original[0].cases[1].body,[]);assert.equal(countNodes(p),4);
 p=editProgram(p,{type:'remove',path:[0,'cases',1,'body',0],mission:m});assert.deepEqual(p[0].cases[1].body,[move]);assert.deepEqual(p[0].cases[0].body,[]);assert.deepEqual(p[0].default,[right]);assert.equal(sequenceInfo(p,[0,'cases',1,'body']).depth,1);
});
test('criação autorizada funciona na raiz e em if/switch, sem nodeType incompleto',()=>{
 const m=base();let p=editProgram([],{type:'add',nodeType:'switch',switchOptionId:'choose',mission:m});p=editProgram(p,{type:'add',nodeType:'if',path:[0,'cases',0,'body'],mission:m});p=editProgram(p,{type:'add',nodeType:'switch',switchOptionId:'choose',path:[0,'cases',0,'body',0,'then'],mission:m});validateProgram(p,m);assert.equal(countNodes(p),3);
 assert.throws(()=>editProgram([],{type:'add',nodeType:'switch',switchOptionId:'bad',mission:m}));assert.throws(()=>editProgram([],{type:'add',node:built(m)}));
});
test('profundidade conta estruturas, não comprimento dos caminhos de casos',()=>{
 const m=base();let p=[built(m)],path=[0,'cases',0,'body'];
 for(let i=1;i<8;i++){p=editProgram(p,{type:'add',nodeType:'switch',switchOptionId:'choose',mission:m,path});path=[...path,0,'cases',0,'body'];}
 p=editProgram(p,{type:'add',nodeType:'move',mission:m,path});assert.equal(countNodes(p),9);validateProgram(p,m);assert.equal(path.length,32);
 assert.throws(()=>editProgram(p,{type:'add',nodeType:'switch',switchOptionId:'choose',mission:m,path}));
 const large=built(m);large.cases[0].body=Array.from({length:300},()=>move);assert.throws(()=>createExecution(m,[large]));assert.throws(()=>countNodes([large]));
 const cases=built(m);cases.cases=Array.from({length:100},()=>({value:0,body:[]}));assert.throws(()=>createExecution(m,[cases]));
});
test('trocar preset preenchido sem confirmação falha, cancelar conserva e confirmar substitui somente o bloco',()=>{
 const m=base();m.initialVariables.other=1;m.switchOptions.push({id:'other',label:'Outra fonte',selector:sel('other'),cases:[{value:1,label:'Um'},{value:2,label:'Dois'}],defaultLabel:'Outro'});
 const node=built(m);node.cases[0].body=[move];const original=freeze([node,right]);
 assert.throws(()=>editProgram(original,{type:'switchOption',path:[0],switchOptionId:'other',mission:m}),e=>e.code==='switchHasCommands');assert.deepEqual(original[0].cases[0].body,[move]);
 const same=editProgram(original,{type:'switchOption',path:[0],switchOptionId:'choose',mission:m});assert.deepEqual(same,original);
 const replaced=editProgram(original,{type:'switchOption',path:[0],switchOptionId:'other',mission:m,confirmDiscard:true});assert.equal(replaced[0].selector.name,'other');assert.deepEqual(replaced[1],right);assert.deepEqual(replaced[0].cases[0].body,[]);assert.deepEqual(original[0].cases[0].body,[move]);
});
test('rebasing mantém caso selecionado ao editar folhas e ajusta caminho quando o pai muda de índice',()=>{
 const m=base();let p=[built(m),move];p[0].cases[1].body=[move,right];const target=[0,'cases',1,'body'];
 const op={type:'remove',path:[0,'cases',1,'body',0]};const next=editProgram(p,op);assert.deepEqual(rebaseTarget(next,target,op),target);
 const moved=editProgram(p,{type:'move',path:[0],offset:1});assert.deepEqual(rebaseTarget(moved,target,{type:'move',path:[0],offset:1}),[1,'cases',1,'body']);
 assert.deepEqual(rebaseTarget([move],target,{type:'remove',path:[0]}),[]);assert.match(insertionLabel(m,p,target),/Programa principal.*Alternativa 2/);
});
test('renderização expõe valores/casos e destaca somente um ramo, com paleta apenas no selecionado',()=>{
 const m=base('number',1),node=built(m);node.cases[0].body=[left];node.cases[1].body=[move];const e=stepExecution(m,[node],createExecution(m,[node]));
 const html=renderProgram([node],m,e,[0,'cases',1,'body'],false);assert.match(html,/ESCOLHA/);assert.match(html,/CASO Alternativa 2/);assert.match(html,/Outro valor/);assert.equal((html.match(/executing-branch/g)??[]).length,1);assert.equal((html.match(/class="branch-tools"/g)??[]).length,1);assert.match(html,/data-target="0.cases.1.body"/);assert.match(html,/Não escolhido/);assert.doesNotMatch(html,/<input[^>]+value="1"/);
 const trace=renderDecisionTrace(m,e.state);assert.match(trace,/VALOR CONSULTADO/);assert.match(trace,/COMPARAÇÃO/);assert.match(trace,/Alternativa 2/);assert.match(commandMessages(m,e.state).join(' '),/Executar somente/);
});
test('orçamento conta escolha uma vez e impede instruções restantes',()=>{
 const m=base(),node=built(m);node.cases[0].body=[move,move];assert.equal(end(m,[node]).instructionPointer,3);const limited=end(m,[node],{instructionLimit:2});assert.equal(limited.status,'limit');assert.equal(limited.col,1);assert.equal(limited.instructionPointer,2);
});
for(const demo of missions.filter(m=>m.id>=22))test(`demo ${demo.id}: mesma AST, simulação/passos/sessão equivalentes e reset`,()=>{
 const program=freeze(structuredClone(demo.solution));
 for(const scenario of missionVariants(demo)){
  const input=freeze(structuredClone(scenario));let e=freeze(createExecution(input,program));const states=[e.state];while(!terminal(e.state)){e=freeze(stepExecution(input,program,e));states.push(e.state);}assert.deepEqual(states,simulate(input,program));assert.equal(e.state.status,'won');assert(states.some(s=>s.events.some(event=>event.type==='switch')));
 }
 let s=finish(createSession(demo,program));assert.equal(s.completed,false);s=startVariantTests(s);if(demo.id===22)assert.equal(s.execution.state.memory.corNecessaria.known,false);s=finish(s);assert.equal(s.completed,true);assert.equal(s.passed.length,3);
});
test('demo 22 escolhe três casos, interação errada falha e ausência de inspeção não usa padrão',()=>{
 const m=missions.find(m=>m.id===22),scenarios=missionVariants(m);assert.deepEqual(scenarios.map(s=>simulate(s,m.solution).flatMap(state=>state.events).find(event=>event.type==='switch').selected.index),[0,1,2]);
 for(const s of scenarios)assert.equal(end(s,m.solution.slice(1)).reason,'memoryUnknown');
 const wrong=structuredClone(m.solution);wrong[1].cases[0].body[0].entityId='opcao-azul';const last=end(scenarios[0],wrong);assert.equal(last.reason,'preconditionFailed');assert.deepEqual(last.consumedIds,[]);assert.equal(last.variables.liberada,false);
});
test('demo 23 executa zero, um e default em variantes vencedoras e preserva física',()=>{
 const m=missions.find(m=>m.id===23),variants=missionVariants(m),events=variants.map(s=>simulate(s,m.solution).flatMap(state=>state.events).find(event=>event.type==='switch'));
 assert.deepEqual(events.map(e=>e.selected.kind),['case','case','default']);assert.deepEqual(events.map(e=>e.value),[0,1,2]);assert.deepEqual(variants.map(s=>end(s,m.solution).variables.escolha),['zero','um','outro']);
 const impossible=structuredClone(variants[2]);impossible.initialVariables.carga=4;const last=end(impossible,m.solution);assert.equal(last.status,'collision');assert.equal(last.reason,'capacityExceeded');assert.equal(last.row,4);assert.equal(last.col,2);assert.equal(last.events[0].actual,4);
});
test('JSON completo pode ser carregado/serializado e renomeado sem modificar o motor',async()=>{
 const text=await readFile(new URL('../docs/V06-example.json',import.meta.url),'utf8'),m=JSON.parse(text);validateMission(m);assert.deepEqual(JSON.parse(JSON.stringify(m)),m);for(const variant of missionVariants(m))assert.equal(end(variant,m.solution).status,'won');
 let renamed=text;for(const [a,b] of [['corNecessaria','observed'],['cor','signal'],['fechadura','sensorX'],['opcao-vermelho','itemOne'],['opcao-azul','itemTwo'],['opcao-verde','itemThree'],['vermelho','one'],['azul','two'],['verde','three'],['take','press'],['Chave vermelha','Opção um'],['Chave azul','Opção dois'],['Chave verde','Opção três']])renamed=renamed.replaceAll('"'+a+'"','"'+b+'"');
 const n=JSON.parse(renamed);validateMission(n);for(const variant of missionVariants(n))assert.equal(end(variant,n.solution).status,'won');
});
test('rebasing de ramo aninhado acompanha remoção de um irmão anterior sem mudar o destino lógico',()=>{
 const m=base(),node=built(m);node.cases[0].body=[move,ifNode([right])];const program=[node],target=[0,'cases',0,'body',1,'then'],op={type:'remove',path:[0,'cases',0,'body',0]};
 const next=editProgram(program,op),rebased=rebaseTarget(next,target,op);assert.deepEqual(rebased,[0,'cases',0,'body',0,'then']);assert.deepEqual(sequenceAt(next,rebased),[right]);assert.deepEqual(sequenceAt(program,target),[right]);
});
test('oito casos vazios contam um nó e o limite de 300 nós continua inclusivo',()=>{
 const m=base('number',7,[0,1,2,3,4,5,6,7]),node=built(m);assert.equal(countNodes([node]),1);assert.equal(end(m,[node]).instructionPointer,1);assert.equal(simulate(m,[node])[1].events[0].selected.index,7);
 node.cases[0].body=Array.from({length:299},()=>move);assert.equal(countNodes([node]),300);assert.equal(validateProgram([node],m),true);
});

test('confirmação também protege e substitui corretamente um preset com apenas default preenchido',()=>{
 const m=base();m.initialVariables.other=1;m.switchOptions.push({id:'other',label:'Outra fonte',selector:sel('other'),cases:[{value:1,label:'Um'},{value:2,label:'Dois'}]});const node=built(m);node.default=[move,move];
 assert.equal(switchHasCommands(node),true);assert.equal(typeof switchHasCommands(node),'boolean');assert.throws(()=>editProgram([node],{type:'switchOption',path:[0],switchOptionId:'other',mission:m}));
 const result=editProgram([node],{type:'switchOption',path:[0],switchOptionId:'other',mission:m,confirmDiscard:switchHasCommands(node)});assert.deepEqual(result[0].default,[]);assert.deepEqual(node.default,[move,move]);
});
test('variantes mantêm os IDs de criação dos presets sem alterar a independência da AST',()=>{
 const m=base(),option={...structuredClone(m.switchOptions[0]),id:'renamed'};m.variants=[{id:'a',label:'A'},{id:'b',label:'B',switchOptions:[option]}];assert.throws(()=>validateMission(m));
});
