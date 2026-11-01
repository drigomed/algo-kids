import {escapeHtml as h} from './html.js';
import {switchOption} from './switches.js';
import {selectorLabel} from './switch-copy.js';
import {renderBranch} from './branch-view.js';
const prefix=(path,full)=>full&&path.every((part,index)=>part===full[index])&&full.length>=path.length;
export function renderSwitch({mission,node,path,key,controls,execution,target,disabled,render}) {
  const active=JSON.stringify(path)===JSON.stringify(execution.activePath),within=prefix(path,execution.activePath);
  const option=switchOption(mission,node);let selected=null;
  if(active&&JSON.stringify(execution.decision?.path)===JSON.stringify(path))selected=execution.decision.selected;
  else if(within&&execution.activePath[path.length]==='cases')selected={kind:'case',index:execution.activePath[path.length+1]};
  else if(within&&execution.activePath[path.length]==='default')selected={kind:'default'};
  const branches=node.cases.map((item,index)=>renderBranch({mission,list:item.body,path:[...path,'cases',index,'body'],label:`CASO ${option.cases[index].label}`,target,chosen:selected?.kind==='case'&&selected.index===index,deciding:!!selected,disabled,kind:'switch-case',render}));
  branches.push(renderBranch({mission,list:node.default,path:[...path,'default'],label:option.defaultLabel??'OUTRO VALOR',target,chosen:selected?.kind==='default',deciding:!!selected,disabled,kind:'switch-default',render}));
  return `<li class="switch-block ${within?'active-block':''} ${active?'active':''}" ${active?'aria-current="step"':''}><div class="condition-heading"><strong>◇ ESCOLHA</strong>${controls}</div><label class="switch-choice">Escolher usando<select data-field="switch-option" data-path="${key}" ${disabled||mission.switchOptions.length===1?'disabled':''}>${mission.switchOptions.map(item=>`<option value="${h(item.id)}" ${item.id===option.id?'selected':''}>${h(item.label)}</option>`).join('')}</select></label><p class="switch-source">Fonte: ${h(selectorLabel(mission,node.selector))}. Apenas um caminho será executado.</p>${branches.join('')}</li>`;
}
