import {themeConfig} from '../presentation/theme-config.js';
import {validVariable} from '../data.js';
import {escapeHtml as h,renderBoard} from '../view.js';
import {renderMemory,commandMessages,failureMessage,collisionMessage} from '../command-view.js';
import {renderResultBanner} from '../presentation/scene-view.js';
import {createVisualEffects} from '../presentation/visual-effects.js';
import {installAssetFallback} from '../presentation/asset-registry.js';
import {missions} from '../missions.js';
import {configureCommand} from '../commands.js';
import {configureCondition,conditionOptions,valuesFor} from '../condition-options.js';
import {switchHasCommands} from '../switches.js';
import {nodeAt,rebaseTarget,decodePath,countNodes} from '../tree.js';
import {createDraft,newMission,transact,undo,redo,at,assign,resolved,place,resize,addVariant,inheritField,removeAt,renameDeclaration} from './model.js';
import {diagnose} from './validation.js';
import {parseMission,downloadMission} from './io.js';
import {localDraftStorage} from './draft-storage.js';
import {renderInspector,pathAttribute,defaultForItem,readTyped,typeDefault} from './inspectors.js';
import {schemaAt,concrete,defaultValue,labels} from './authoring-schema.js';
import {renderAuthorBoard,cellInspector} from './board-editor.js';
import {changeSolution,addSolution,programView,removeSolutionRoot} from './program-editor.js';
import {createPlaytest,stepPlaytest,interruptPlaytest,testState,referenceValidated,qualityWarnings} from './playtest.js';
export function mountStudio(document,environment={}){
 const $=selector=>document.querySelector(selector),storage=environment.storage??localDraftStorage(),confirm=environment.confirm??(message=>globalThis.confirm(message));
 const setTimer=environment.setTimeout??globalThis.setTimeout,clearTimer=environment.clearTimeout??globalThis.clearTimeout;
 let draft=createDraft(),path=[],scenario=-1,cell={row:4,col:0},selected=null,target=[],tab='board',test=null,running=false,timer=null,generation=0,message='',storageMessage='',testKey='',testEpoch=0;
 const effects=createVisualEffects();installAssetFallback(document);
 function pause(){clearTimer(timer);timer=null;running=false;generation++;}
 function showError(error){message=error.message;render();}
 function save(){const status=storage.save(draft.mission);storageMessage=status.ok?'Rascunho salvo neste navegador. Exporte para compartilhar.':status.message;}
 function commit(change){pause();const next=transact(draft,change);if(next!==draft){draft=next;test=null;testKey='';}save();render();}
 function open(next){while(next.length){try{at(draft.mission,next);break;}catch{next=next.slice(0,-1);}}path=next;render();$('#inspector').querySelector?.('button,input,select')?.focus();}
 function replace(mission){if(!confirm('Substituir o rascunho atual? Exporte antes se quiser preservar uma cópia.'))return;pause();draft=createDraft(mission);path=[];scenario=-1;test=null;target=[];selected=null;save();render();}
 function render(){
  const focused=document.activeElement,focusAttribute=['value','valueType','union'].find(key=>focused?.dataset?.[key]!==undefined),focusKey=focusAttribute?focused.dataset[focusAttribute]:null;
  const m=draft.mission;if(scenario>=(m.variants?.length??0))scenario=-1;const diagnosis=diagnose(m),current=resolved(m,scenario);
  $('#message').textContent=message;$('#storage-status').textContent=storageMessage;
  $('#undo').disabled=!draft.past.length;$('#redo').disabled=!draft.future.length;$('#export').disabled=!diagnosis.valid;
  $('#scenario').innerHTML='<option value="-1">Base (fora das variantes)</option>'+(m.variants??[]).map((v,i)=>`<option value="${i}" ${i===scenario?'selected':''}>${h(v.label??v.id)}</option>`).join('');$('#scenario').value=String(scenario);
  $('#width').value=current.grid?.width??5;$('#height').value=current.grid?.height??5;
  const basic=['id','title','instructions','hint','start','goal','presentation','entities','grid'];const fields=Object.keys(m).filter(key=>$('#advanced').checked||basic.includes(key));
  $('#section').innerHTML='<option value="">Missão · campos disponíveis</option>'+fields.map(key=>`<option value="${key}" ${path[0]===key?'selected':''}>${h(labels[key]??key)}</option>`).join('');
  $('#inspector').innerHTML=renderInspector(m,path,{basic:!$('#advanced').checked});
  $('#diagnostics').innerHTML=[...diagnosis.errors.map(item=>({...item,kind:'error'})),...diagnosis.warnings.map(item=>({...item,kind:'warning'}))].map(item=>`<p class="studio-${item.kind}"><button data-open="${pathAttribute(item.path)}">${h(item.path.join('.')||'mission')}</button> ${h(item.message)}</p>`).join('')||'<p class="studio-success">Estrutura válida. Teste a solução para verificar os cenários.</p>';
  $('#document-preview').textContent=JSON.stringify(m,null,2);
  for(const [id,visible] of [['board-section',tab==='board'||tab==='rules'],['variants-section',tab==='variants'],['program-section',tab==='program']])$('#'+id).hidden=!visible;
  document.querySelectorAll('[data-tab]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.tab===tab)));
  try{$('#board').style.setProperty('--columns',current.grid.width);$('#board').style.setProperty('--rows',current.grid.height);$('#board').innerHTML=renderAuthorBoard(current,cell);$('#cell-info').innerHTML=cellInspector(current,cell);}catch(error){$('#board').innerHTML='';$('#cell-info').textContent='Prévia indisponível até corrigir: '+error.message;}
  $('#variants-list').innerHTML=(m.variants??[]).map((v,i)=>`<fieldset><legend>${h(v.label??v.id)}</legend><button data-variant-select="${i}">Editar cenário</button><button data-variant-copy="${i}">Duplicar</button><button data-open="${pathAttribute(['variants',i])}">Nome / configurações</button><button data-delete="${pathAttribute(['variants',i])}">Remover variante</button><button data-reorder="${pathAttribute(['variants',i])}" data-offset="-1" ${i===0?'disabled':''}>↑</button><button data-reorder="${pathAttribute(['variants',i])}" data-offset="1" ${i===m.variants.length-1?'disabled':''}>↓</button>${['grid','start','goal','initialVariables','entities','barriers','presentation','commandOptions','conditionOptions','switchOptions','loopOptions','robotMemory','winCondition'].map(field=>`<div><strong>${h(labels[field]??field)}</strong> · ${Object.hasOwn(v,field)?'Sobrescrito':'Herdado da base'} <button data-override="${i}" data-field="${field}">Copiar campo completo / editar</button>${Object.hasOwn(v,field)?`<button data-inherit="${i}" data-field="${field}">Voltar à herança</button>`:''}</div>`).join('')}</fieldset>`).join('')||'<p>Sem variantes. Adicionar uma variante mantém os campos herdados.</p>';
  const choices=[['move','Avançar'],['turnLeft','Esquerda'],['turnRight','Direita'],['if','SE / SENÃO'],...(m.commandOptions??[]).map(o=>['command:'+o.id,o.label]),...(m.switchOptions??[]).map(o=>['switch:'+o.id,o.label]),...(m.loopOptions??[]).map(o=>['loop:'+o.id,o.label])];
  $('#program-tools').innerHTML=choices.map(([key,label])=>`<button data-solution-add="${h(key)}" ${running?'disabled':''}>${h(label)}</button>`).join('');$('#program-destination').textContent='Destino de inserção: '+(target.length?target.join(' → '):'sequência principal');
  try{$('#program').innerHTML=programView(m,target,test?.sessions[test.index]?.execution);}catch(error){$('#program').innerHTML=`<li>Corrija regras/permissões para editar os blocos: ${h(error.message)}</li>${(Array.isArray(m.solution)?m.solution:[]).map((node,i)=>`<li><button data-repair-root="${i}">Remover bloco principal ${i+1} · ${h(node.type)}</button></li>`).join('')}`;}
  $('#run').disabled=running||!diagnosis.valid||!m.solution?.length;$('#test-all').disabled=$('#run').disabled;$('#pause').disabled=!test||test.done;$('#step').disabled=running||!diagnosis.valid||!m.solution?.length||!!test?.done;$('#stop').disabled=!test||test.done;$('#reset-test').disabled=!test;
  if(test){const state=testState(test),scene=test.scenarios[test.index],complete=referenceValidated(test,m),key=`${testEpoch}:${draft.revision}:${test.index}:${state.instructionPointer}:${state.status}:${test.interrupted}:${test.done}:${complete}`;
   if(key!==testKey){const visual=effects.next(scene,state,{context:testEpoch+':'+draft.revision+':'+test.index+':'+complete,completed:complete,interrupted:test.interrupted});$('#test-board').style.setProperty('--columns',scene.grid.width);$('#test-board').style.setProperty('--rows',scene.grid.height);$('#test-board').dataset.visualStatus=test.interrupted?'stopped':state.status;$('#test-board').setAttribute('aria-label',`Prévia ${scene.variantLabel??'do cenário'}. Robô na linha ${state.row+1}, coluna ${state.col+1}, direção ${state.direction}. Estado ${state.status}.`);$('#test-board').innerHTML=renderBoard(scene,state,null,{...visual,completed:complete,interrupted:test.interrupted});testKey=key;}
   $('#test-result').innerHTML=renderResultBanner(state,{completed:referenceValidated(test,m),interrupted:test.interrupted});$('#test-memory').innerHTML=renderMemory(scene,state)+`<p>Objetos coletados: ${state.collectedCount}</p><pre>${h(JSON.stringify(state.variables,null,2))}</pre>`;
   $('#test-trace').textContent=(state.status==='collision'?collisionMessage(scene,state):state.status==='actionFailed'?failureMessage(scene,state):commandMessages(scene,state).join(' '))+'\n'+JSON.stringify(test.trace.slice(-20),null,2);
   const reports=test.reports;$('#test-report').innerHTML=`${referenceValidated(test,m)?'<p class="studio-success">Solução de referência validada nas variantes atuais</p>':'<p>Esta versão ainda não tem selo de solução validada em todos os cenários.</p>'}<table><thead><tr><th>Cenário</th><th>Resultado / motivo</th><th>Posição</th><th>Instruções</th></tr></thead><tbody>${reports.map(r=>`<tr><td>${h(r.label)}</td><td>${h(r.status)} ${h(r.reason)}</td><td>${r.row}, ${r.col}, ${r.direction}</td><td>${r.instructions}</td></tr>`).join('')}</tbody></table>${test.done?qualityWarnings(test).map(w=>`<p class="studio-warning">${h(w)}</p>`).join(''):''}`;
  }else for(const id of ['test-board','test-result','test-memory','test-trace','test-report'])$('#'+id).innerHTML='';
  if(focusAttribute)Array.from(document.querySelectorAll('[data-'+focusAttribute.replace(/[A-Z]/g,c=>'-'+c.toLowerCase())+']')).find(node=>node.dataset[focusAttribute]===focusKey)?.focus({preventScroll:true});
 }
 function attempt(fn){try{message='';fn();}catch(error){showError(error);}}
 function applyProgram(operation){commit(m=>{m.solution=changeSolution(m,operation);target=rebaseTarget(m.solution,target,operation);});}
 function start(all){pause();testEpoch++;test=createPlaytest(draft.mission,{all,scenario,instructionLimit:Number($('#instruction-limit').value)});testKey='';running=true;tick();}
 function step(){if(!test){testEpoch++;test=createPlaytest(draft.mission,{all:true,instructionLimit:Number($('#instruction-limit').value)});}test=stepPlaytest(test);if(test.done)pause();render();}
 function schedule(){const token=generation;timer=setTimer(()=>{if(running&&token===generation)tick();},250);}
 function tick(){if(!running)return;step();if(running)schedule();}
 $('#new').onclick=()=>attempt(()=>replace(newMission()));
 $('#template').innerHTML='<option value="">Escolher cópia de exemplo…</option>'+missions.map(m=>`<option value="${m.id}">${h(m.title)}</option>`).join('');
 $('#template').onchange=()=>attempt(()=>{const source=missions.find(m=>String(m.id)===$('#template').value);if(!source)return;const copy=structuredClone(source);copy.id='studio-copia-'+source.id;const {label,...visual}=themeConfig(source);copy.presentation={...copy.presentation,visual:structuredClone(visual)};replace(copy);});
 $('#import').onchange=async event=>{const file=event.target.files?.[0];if(!file)return;try{if(!file.name.toLowerCase().endsWith('.json'))throw new Error('Selecione um arquivo .json');if(file.size>1024*1024)throw new Error('Arquivo excede 1 MiB');const mission=parseMission(await file.text());replace(mission);}catch(error){showError(error);}event.target.value='';};
 $('#export').onclick=()=>attempt(()=>{if(!referenceValidated(test,draft.mission)&&!confirm('Missão estruturalmente válida, mas solução ainda não validada nas variantes atuais. Exportar mesmo assim?'))return;(environment.download??downloadMission)(draft.mission,document);message='JSON exportado. O arquivo não foi publicado no catálogo.';render();});
 $('#validate').onclick=()=>render();$('#advanced').onchange=()=>render();$('#section').onchange=()=>open($('#section').value?[$('#section').value]:[]);
 $('#undo').onclick=()=>{pause();draft=undo(draft);test=null;scenario=-1;target=[];path=[];save();render();};$('#redo').onclick=()=>{pause();draft=redo(draft);test=null;scenario=-1;target=[];path=[];save();render();};
 $('#clear-draft').onclick=()=>{if(confirm('Apagar o rascunho salvo neste navegador? Exporte antes se precisar.')){pause();const status=storage.clear();draft=createDraft();test=null;scenario=-1;path=[];target=[];storageMessage=status.ok?'Rascunho local apagado. Documento novo em memória.':status.message;render();}};
 $('#scenario').onchange=()=>{scenario=Number($('#scenario').value);selected=null;render();};
 $('#resize').onclick=()=>attempt(()=>{const w=Number($('#width').value),height=Number($('#height').value);try{commit(m=>resize(m,scenario,w,height));}catch(error){if(error.message.includes('ficariam fora')&&confirm(error.message))commit(m=>resize(m,scenario,w,height,true));else throw error;}});
 $('#board').onclick=event=>attempt(()=>{const button=event.target.closest('[data-row]');if(!button)return;cell={row:Number(button.dataset.row),col:Number(button.dataset.col)};const tool=$('#tool').value;if(tool==='select')render();else commit(m=>place(m,scenario,tool,cell.row,cell.col,selected));});
 $('#add-variant').onclick=()=>attempt(()=>commit(m=>addVariant(m)));
 $('#clear-solution').onclick=()=>{if(confirm('Apagar todos os comandos da solução? Os dados do mundo serão preservados.'))commit(m=>{m.solution=[];target=[];});};
 $('#program-root').onclick=()=>{target=[];render();};
 $('#run').onclick=()=>attempt(()=>start(false));$('#test-all').onclick=()=>attempt(()=>start(true));$('#step').onclick=()=>attempt(step);
 $('#pause').onclick=()=>{if(running){pause();render();}else if(test&&!test.done){running=true;schedule();render();}};
 $('#stop').onclick=()=>{pause();if(test)test=interruptPlaytest(test);render();};$('#reset-test').onclick=()=>{pause();test=null;testKey='';render();};$('#back-edit').onclick=()=>{pause();tab='board';render();};
 document.addEventListener('click',event=>attempt(()=>{
  const button=event.target.closest('button');if(!button||button.disabled)return;const d=button.dataset;
  if(d.tab){tab=d.tab;if(tab==='rules')$('#advanced').checked=true;render();}
  else if(d.open!==undefined){if(tab==='variants')tab='rules';open(JSON.parse(d.open));}
  else if(d.object){selected=JSON.parse(d.object);if(scenario>=0){commit(m=>{const field=selected[0];m.variants[scenario][field]=structuredClone(resolved(m,scenario)[field]);});open(['variants',scenario,...selected]);}else open(selected);}
  else if(d.variantSelect){scenario=Number(d.variantSelect);tab='board';selected=null;render();}
  else if(d.variantCopy!==undefined)commit(m=>addVariant(m,Number(d.variantCopy)));
  else if(d.inherit!==undefined){if(confirm('Descartar este override e herdar da base?'))commit(m=>inheritField(m,Number(d.inherit),d.field));}
  else if(d.override!==undefined){const i=Number(d.override),field=d.field;commit(m=>{const scenario=resolved(m,i);m.variants[i][field]=Object.hasOwn(scenario,field)?structuredClone(scenario[field]):defaultValue(schemaAt(m,[field]));});tab='rules';open(['variants',i,field]);}
  else if(d.delete){const pointer=JSON.parse(d.delete),value=at(draft.mission,pointer);if(value&&typeof value==='object'&&Object.keys(value).length&&!confirm('Excluir este item e todos os campos/regras internos? As dependências serão diagnosticadas.'))return;commit(m=>removeAt(m,pointer,true));}
  else if(d.reorder){const pointer=JSON.parse(d.reorder),offset=Number(d.offset);commit(m=>{const list=at(m,pointer.slice(0,-1)),i=pointer.at(-1),j=i+offset;if(j<0||j>=list.length)throw new Error('Posição inválida');[list[i],list[j]]=[list[j],list[i]];});scenario=-1;}
  else if(d.addItem){const pointer=JSON.parse(d.addItem);commit(m=>at(m,pointer).push(defaultForItem(m,pointer)));}
  else if(d.addField){const pointer=JSON.parse(d.addField),key=$('#new-field').value;commit(m=>{const schema=concrete(schemaAt(m,pointer),at(m,pointer),pointer);assign(m,[...pointer,key],defaultValue(schema.fields[key],undefined,[...pointer,key]));});}
  else if(d.addKey){const pointer=JSON.parse(d.addKey),key=$('#new-key').value;if(!/^[A-Za-z][A-Za-z0-9_-]{0,127}$/.test(key)||['constructor','prototype'].includes(key))throw new Error('Nome de campo inválido');commit(m=>{const object=at(m,pointer);if(['initialVariables','robotMemory'].includes(pointer[0])&&!validVariable(key))throw new Error('Nome de variável reservado ou inválido');if(Object.hasOwn(object,key))throw new Error('Nome duplicado');const schema=concrete(schemaAt(m,pointer),object,pointer);object[key]=defaultValue(schema.item);});}
  else if(button.id==='rename-variable')commit(m=>renameDeclaration(m,path[0],$('#rename-old').value,$('#rename-new').value));
  else if(d.repairRoot!==undefined){if(confirm('Remover este bloco principal e todos os comandos internos?'))commit(m=>{m.solution=removeSolutionRoot(m,Number(d.repairRoot));target=[];});}
  else if(d.solutionAdd){const [kind,id]=d.solutionAdd.split(':');commit(m=>{m.solution=addSolution(m,target,kind,id);});}
  else if(d.target!==undefined&&!d.inlineAdd&&!d.inlineOption&&!d.inlineSwitch&&!d.inlineLoop&&button.closest('#program')){target=decodePath(d.target);render();}
  else if(d.inlineAdd||d.inlineOption||d.inlineSwitch||d.inlineLoop){const dest=decodePath(d.target);commit(m=>{m.solution=addSolution(m,dest,d.inlineOption?'command':d.inlineSwitch?'switch':d.inlineLoop?'loop':d.inlineAdd,d.inlineOption??d.inlineSwitch??d.inlineLoop);});target=dest;render();}
  else if(d.edit){const pointer=decodePath(d.path),node=nodeAt(draft.mission.solution,pointer).node;if(d.edit==='remove'&&countNodes([node])>1&&!confirm('Remover o bloco e todos os comandos internos?'))return;applyProgram({type:d.edit==='remove'?'remove':'move',path:pointer,offset:d.edit==='up'?-1:1});}
 }));
 document.addEventListener('change',event=>attempt(()=>{
  const input=event.target,d=input.dataset;
  if(d.value){const pointer=JSON.parse(d.value);commit(m=>assign(m,pointer,readTyped(d.kind,input.value)));}
  else if(d.valueType){const pointer=JSON.parse(d.valueType);if(at(draft.mission,pointer)&&typeof at(draft.mission,pointer)==='object'&&!confirm('Substituir estrutura por outro tipo?'))return;commit(m=>assign(m,pointer,structuredClone(typeDefault(input.value))));}
  else if(d.union){const pointer=JSON.parse(d.union);if(!confirm('Trocar esta estrutura substitui seus campos internos. Continuar?')){render();return;}commit(m=>assign(m,pointer,defaultValue(schemaAt(m,pointer),input.value,pointer)));}
  else if(d.field&&input.closest('#program')){
   const pointer=decodePath(d.path),node=nodeAt(draft.mission.solution,pointer).node;
   if(d.field==='loop-option')applyProgram({type:'loopOption',path:pointer,loopOptionId:input.value});
   else if(d.field==='switch-option'){const occupied=switchHasCommands(node);if(occupied&&!confirm('Trocar ESCOLHA descarta caminhos. Continuar?')){render();return;}applyProgram({type:'switchOption',path:pointer,switchOptionId:input.value,confirmDiscard:occupied});}
   else if(d.field.startsWith('command-')){const option=input.closest('.explicit-command').querySelector('[data-field="command-option"]').value;applyProgram({type:'command',path:pointer,node:configureCommand(draft.mission,option,d.field==='command-value'?Number(input.value):undefined)});}
   else {const block=input.closest('.condition-block'),optionId=block.querySelector(':scope > .condition-choice select').value,option=conditionOptions(draft.mission).find(o=>o.id===optionId),fields={};if(d.field!=='condition'){const variable=block.querySelector(':scope > .threshold-fields select'),choice=block.querySelector(':scope > .value-fields select'),number=block.querySelector(':scope > .threshold-fields input,:scope > .value-fields input');if(variable)fields.variable=variable.value;if(choice)fields.value=valuesFor(option)[Number(choice.value)].value;if(number)fields.value=readTyped('number',number.value);}applyProgram({type:'condition',path:pointer,condition:configureCondition(draft.mission,optionId,fields)});}
  }
 }));
 const restored=storage.load();if(restored.ok&&restored.mission){draft=createDraft(restored.mission);storageMessage='Rascunho local restaurado, ainda sujeito a validação/teste.';}else if(!restored.ok)storageMessage=restored.message;try{render();}catch(error){draft=createDraft();scenario=-1;path=[];storageMessage='Não foi possível apresentar o rascunho armazenado. Novo documento em memória; o dado local foi preservado. '+error.message;render();}
 return {getDraft:()=>structuredClone(draft),getTest:()=>test,render,pause,importText:text=>replace(parseMission(text))};
}
if(typeof document!=='undefined')mountStudio(document);
