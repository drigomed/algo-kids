import {escapeHtml as h} from './html.js';
import {loopOption,loopContext,stalledMessage,stoppedMessage} from './loops.js';
import {conditionQuestion} from './condition-options.js';
import {nodeAt} from './tree.js';
export function loopTitle(mission,node) {return node.type==='for'?`REPITA ${node.times} VEZES`:`ENQUANTO ${loopOption(mission,node)?.label??'a condição for verdadeira'}`;}
export function loopMessage(mission,event) {
  if(event.loopType==='for')return event.result?`Repetição ${event.iteration} de ${event.times}. Vou executar os comandos daqui.`:`Já repeti ${event.completed} vezes. Vou continuar depois do bloco.`;
  const question=loopOption(mission,{type:'while',condition:event.condition})?.label??conditionQuestion(mission,event.condition);
  return `${question} ${event.result?'Sim. Vou repetir.':'Não. Vou continuar depois do bloco.'}`;
}
export function renderLoopPalette(mission,disabled=false,inlinePath) {
  return (mission.loopOptions??[]).map(option=>`<button class="loop-palette-button" ${inlinePath===undefined?'data-loop-option':'data-inline-loop'}="${h(option.id)}" ${inlinePath===undefined?'':`data-target="${inlinePath}"`} ${disabled?'disabled':''}><b>${option.kind==='for'?'↻':'⟳'}</b><span>${h(loopTitle(mission,{type:option.kind,...(option.kind==='for'?{times:option.times}:{condition:option.condition})}))}</span></button>`).join('');
}
export function renderLoop({mission,node,path,key,controls,execution,target,disabled,render,branch}) {
  const active=JSON.stringify(path)===JSON.stringify(execution.activePath);
  const controller=execution.frames.find(frame=>frame.kind==='loop'&&JSON.stringify(frame.path)===JSON.stringify(path));
  const inside=controller&&execution.activePath?.length>path.length&&path.every((part,i)=>execution.activePath[i]===part);
  const event=execution.state.events.find(event=>event.type==='loopCheck'&&JSON.stringify(event.path)===JSON.stringify(path));
  const option=loopOption(mission,node),choices=(mission.loopOptions??[]).filter(item=>item.kind===node.type);
  const bodyPending=execution.frames.some(frame=>frame.kind!=='loop'&&JSON.stringify(frame.path)===JSON.stringify([...path,'body']));
  const iteration=event?.iteration??(controller?controller.completed+(inside&&!bodyPending?0:1):0);
  const progress=controller?node.type==='for'?`Repetição ${iteration} de ${node.times}`:`Repetição ${iteration}`:'';
  return `<li class="loop-block ${active?'active':''}" ${active?'aria-current="step"':''}><div class="loop-heading"><strong>${h(loopTitle(mission,node))}</strong>${controls}</div><label class="loop-choice">${node.type==='for'?'Quantidade de repetições':'Pergunta para continuar'}<select data-field="loop-option" data-path="${key}" ${disabled||choices.length===1?'disabled':''}>${choices.map(item=>`<option value="${h(item.id)}" ${item.id===option?.id?'selected':''}>${h(item.label)}</option>`).join('')}</select></label>${progress?`<p class="loop-progress">${h(progress)}</p>`:''}${event?`<p class="loop-check-result">${h(loopMessage(mission,event))}</p>`:''}${branch({mission,list:node.body,path:[...path,'body'],label:'CORPO',target,chosen:!!inside||!!event?.result,disabled,kind:'loop-body',render})}</li>`;
}
export function renderLoopTrace(mission,execution,program) {
  if(!mission.loopOptions?.length)return '';
  const event=execution.state.events.find(event=>event.type==='loopCheck'||event.type==='loopStalled'||event.type==='userStopped'&&event.loop||event.type==='limit'&&event.loop||event.type==='actionFailed'&&event.loop);
  const context=loopContext(execution.frames);
  let message='';
  if(event?.type==='loopStalled')message=stalledMessage;
  else if(event?.type==='userStopped')message=stoppedMessage;
  else if(event?.type==='loopCheck')message=loopMessage(mission,event);
  else if(event?.type==='limit')message=`O robô está repetindo muitas vezes. Veja se algo faz a condição mudar. Repetição ${event.loop.iteration}; limite de ${event.instructionLimit} passos.`;
  else if(event?.type==='actionFailed')message=event.reason==='memoryUnknown'?'Ainda não sei essa informação; não consigo decidir se devo continuar.':'A ação não pôde terminar nesta repetição. O programa parou.';
  else if(context&&['won','collision'].includes(execution.state.status))message=execution.state.status==='won'?`Objetivo alcançado na repetição ${context.iteration}!`:`O movimento foi bloqueado na repetição ${context.iteration}. O programa parou.`;
  else if(context) {
    const bodyPending=execution.frames.some(frame=>frame.kind!=='loop'&&JSON.stringify(frame.path)===JSON.stringify([...context.path,'body']));
    if(!bodyPending&&execution.activePath?.length>context.path.length)context.iteration--;
    message=`${loopTitle(mission,nodeAt(program,context.path).node)} · ${context.loopType==='for'?`Repetição ${context.iteration} de ${context.times}`:`Repetição ${context.iteration}`} · Executando o CORPO.`;
  }
  return message?`<p class="loop-trace" role="status" aria-live="polite">${h(message)}</p>`:'';
}
