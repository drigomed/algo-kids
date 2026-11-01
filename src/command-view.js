import {energyMessage} from './energy.js';
import {stalledMessage,stoppedMessage} from './loops.js';
import {renderLoopPalette,loopMessage} from './loop-view.js';
import {switchNarrative,selectorLabel} from './switch-copy.js';
import {objectProperties} from './properties.js';
import {escapeHtml as h} from './html.js';
import {commandOption,explicitTypes} from './commands.js';
import {conditionQuestion} from './condition-options.js';
const titles={inspect:'Inspecionar',setMemory:'Guardar valor',interact:'Interagir'};
const icons={inspect:'◉',setMemory:'▤',interact:'✋'};
export function renderCommandPalette(mission,disabled=false,inlinePath) {
 return (mission.commandOptions??[]).map(option=>`<button ${inlinePath===undefined?'data-command-option':'data-inline-option'}="${h(option.id)}" ${inlinePath===undefined?'':`data-target="${inlinePath}"`} ${disabled?'disabled':''}><b>${icons[option.node.type]}</b><span>${titles[option.node.type]}<small>${h(option.label)}</small></span></button>`).join('');
}
export function renderInlinePalette(mission,path) {
 return `<div class="branch-tools" aria-label="Adicionar neste ramo">${[['move','↑ Avançar'],['turnLeft','↶ Esquerda'],['turnRight','↷ Direita'],...(mission.editorDecisions||mission.conditionOptions||mission.id>=9?[['if','◇ SE / SENÃO']]:[])].map(([type,label])=>`<button data-inline-add="${type}" data-target="${path}">${label}</button>`).join('')}${renderCommandPalette(mission,false,path)}${renderSwitchPalette(mission,false,path)}${renderLoopPalette(mission,false,path)}</div>`;
}
export function renderExplicitCommand(mission,node,key,controls,active,disabled) {
 const option=commandOption(mission,node),lock=disabled?'disabled':'';
 const choices=(mission.commandOptions??[]).filter(item=>item.node.type===node.type);
 const values=option?.values;
 return `<li class="explicit-command ${node.type} ${active?'active':''}" ${active?'aria-current="step"':''}><div class="explicit-heading"><strong>${icons[node.type]} ${titles[node.type]}</strong>${controls}</div><label>Ação<select data-field="command-option" data-path="${key}" ${lock}>${choices.map(item=>`<option value="${h(item.id)}" ${item.id===option?.id?'selected':''}>${h(item.label)}</option>`).join('')}</select></label>${values?`<label>Valor<select data-field="command-value" data-path="${key}" ${lock}>${values.map((item,index)=>`<option value="${index}" ${item.value===node.value?'selected':''}>${h(item.label)}</option>`).join('')}</select></label>`:''}<p class="reach-note">${h(commandDescription(mission,node))}</p></li>`;
}
export function memoryName(mission,variable) { return mission.presentation?.memory?.[variable]?.label??`Informação ${Object.keys(mission.robotMemory??{}).indexOf(variable)+1}`; }
function memoryValueLabel(mission,name,value) {
 return mission.presentation?.memory?.[name]?.values?.find(item=>item.value===value)?.label??(typeof value==='boolean'?(value?'Sim':'Não'):value===''?'Texto vazio':String(value));
}
export function renderMemory(mission,state) {
 const entries=Object.entries(state.memory??{});if(!entries.length)return '';
 return `<section class="memory-card" aria-label="Memória do robô"><h3>▤ Memória do robô</h3><dl>${entries.map(([name,item])=>{
  const changed=state.events.some(event=>['inspected','memoryWritten'].includes(event.type)&&event.variable===name&&event.success);
  return `<div class="memory-field ${changed?'updated':''}"><dt>${h(memoryName(mission,name))}</dt><dd>${item.known?h(memoryValueLabel(mission,name,item.value)):'<span aria-label="Ainda não definido">?</span>'}</dd></div>`;
 }).join('')}</dl></section>`;
}
const reasons={memoryUnknown:'Antes, descubra e guarde essa informação. Use Inspecionar ou Guardar valor.',outOfReach:'Chegue perto e olhe para a casa certa antes de usar esse comando.',propertyMissing:'Não encontrei essa informação na casa à frente. Confira a posição e a direção.',typeMismatch:'Essa informação não combina com o campo de memória. Tente outra fonte.',targetMissing:'Não há um objeto para essa ação aqui.',incompatibleTarget:'Esse objeto não aceita a ação escolhida nesse alcance.',ambiguousTarget:'Há mais de um objeto para a mesma ação. Escolha uma posição com um único alvo.',preconditionFailed:'Ainda falta cumprir uma condição para usar esse objeto.',alreadyUsed:'Essa ação já foi usada nesta tentativa. Reinicie para experimentar de novo.',targetConsumed:'Esse objeto já foi retirado nesta tentativa.',effectFailed:'Essa ação não pôde terminar. O mundo foi preservado; vamos tentar outro caminho.'};
export function failureMessage(mission,state) {
 if(state.status==='energyDepleted')return energyMessage;
 const event=state.events.find(event=>event.type==='actionFailed');
 if(event?.reason==='memoryUnknown'&&['for','while'].includes(event.action))return 'Ainda não sei essa informação; não consigo decidir se devo continuar.';
 return mission.presentation?.entities?.[event?.entityId]?.failureMessages?.[state.reason]??reasons[state.reason]??'Não foi possível realizar a ação. Confira o programa e tente de novo.';
}
export function commandMessages(mission,state) {
 return state.events.flatMap(event=>{
  if(event.type==='loopStalled')return [stalledMessage];
  if(event.type==='userStopped')return [stoppedMessage];
  if(event.type==='loopCheck')return [loopMessage(mission,event)];
  if(event.type==='switch'){const n=switchNarrative(mission,event);return [`${n.source}. ${n.comparison}. ${n.branch}.`];}
  if(event.type==='inspected'&&event.success)return [`Observei ${sourceLabels(mission,{type:'inspect',source:event.source,into:event.variable}).target} na casa ${event.source.relativeTo==='here'?'atual':'à frente'} e guardei ${memoryValueLabel(mission,event.variable,event.value)} em ${memoryName(mission,event.variable)}.`];
  if(event.type==='memoryWritten'&&event.success)return [`Guardei ${memoryValueLabel(mission,event.variable,event.value)} em ${memoryName(mission,event.variable)}. O mundo continua igual.`];
  if(event.type==='interacted'&&event.success)return [mission.presentation?.entities?.[event.entityId]?.interactionMessage??'Interação realizada! Observe o que mudou no mundo.'];
  return [];
 });
}
export function renderDecisionTrace(mission,state) {
 const event=state.events.find(event=>['condition','switch'].includes(event.type)||(event.type==='actionFailed'&&['if','switch'].includes(event.action)));
 if(event?.type==='switch') {
   const narrative=switchNarrative(mission,event);
   return `<ol class="decision-trace switch-trace" aria-label="Como o robô escolheu"><li><small>1 · VALOR CONSULTADO</small>${h(narrative.source)}</li><li><small>2 · COMPARAÇÃO</small>${h(narrative.comparison)}</li><li><small>3 · CAMINHO</small>${h(narrative.branch)}</li></ol>`;
 }
 if(event?.type==='actionFailed'&&event.action==='switch')return `<ol class="decision-trace switch-trace"><li>${h(selectorLabel(mission,event.selector))}: ainda não sei</li><li>Não escolhi nenhum caso</li><li>O padrão também não foi executado</li></ol>`;
 if(!event)return '';
 const failed=event.type==='actionFailed';
 return `<ol class="decision-trace" aria-label="Como o robô decidiu"><li><small>1 · PERGUNTA</small>${h(event.condition?conditionQuestion(mission,event.condition):'Já guardei essa informação?')}</li><li><small>2 · RESPOSTA</small>${failed?'Ainda não sei':event.result?'Sim':'Não'}</li><li><small>3 · CAMINHO</small>${failed?'Nenhum ramo executado':event.result?'ENTÃO':'SENÃO'}</li></ol>`;
}
export {explicitTypes};

function sourceLabels(mission,node) {
  const source=node.source??{},barrier=source.type==='barrierProperty';
  const selector=barrier?source.barrierId:source.entityId??node.entityId;
  const visual=(barrier?mission.presentation?.barriers:mission.presentation?.entities)?.[selector]??{};
  const target=visual.label??(source.type==='cellProperty'?'a casa':barrier?'a passagem':'o objeto');
  const property=visual.propertyLabels?.[source.property]??mission.presentation?.properties?.[source.property]?.label??'informação';
  return {target,property};
}
export function commandDescription(mission,node) {
  const {target,property}=sourceLabels(mission,node);
  const reach=(node.type==='inspect'?node.source.relativeTo:node.relativeTo)==='here'?'casa atual':'casa à frente';
  if(node.type==='inspect')return `Observar ${property} · ${target} · ${reach} → ${memoryName(mission,node.into)}`;
  if(node.type==='interact')return `${commandOption(mission,node)?.label??'Interagir'} · ${target} · ${reach}`;
  return `Guardar em ${memoryName(mission,node.variable)} · sem alterar o mundo`;
}
export function collisionMessage(mission,state) {
  const event=state.events.find(e=>e.type==='collision');
  const template=mission.presentation?.barriers?.[event?.barrierId]?.failureMessages?.[event?.reason]??mission.presentation?.failures?.[event?.reason];
  if(template)return template.replace(/\{(actual|limit)\}/g,(_,key)=>event[key]===undefined?'?':String(event[key]));
  return state.lastEvent==='boundary'?'Opa, o tabuleiro acaba aqui! Que tal mudar o caminho?':state.lastEvent==='barrier'?'Esta passagem está bloqueada para o estado atual. O programa parou.':'Uma rocha no caminho! Vamos tentar contornar?';
}
export function passageIndicators(mission,state) {
  return (mission.barriers??[]).flatMap(barrier=>Object.entries(objectProperties(barrier,state)).map(([name,value])=>`${mission.presentation?.barriers?.[barrier.id]?.label??'Passagem'} · ${mission.presentation?.barriers?.[barrier.id]?.propertyLabels?.[name]??'Informação'}: ${typeof value==='boolean'?(value?'Sim':'Não'):value}`)).join(' | ');
}
export function resultLabel(category) {return {interrupted:'Interrompido por você',success:'Objetivo concluído',failure:'Programa interrompido',incomplete:'Programa incompleto',inProgress:'Em andamento'}[category];}

export function renderSwitchPalette(mission,disabled=false,inlinePath) {
  return (mission.switchOptions??[]).map(option=>`<button ${inlinePath===undefined?'data-switch-option':'data-inline-switch'}="${h(option.id)}" ${inlinePath===undefined?'':`data-target="${inlinePath}"`} ${disabled?'disabled':''}><b>◇</b><span>ESCOLHA<small>${h(option.label)}</small></span></button>`).join('');
}
