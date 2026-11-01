import {renderSceneBoard} from './presentation/scene-view.js';
import {renderLoop} from './loop-view.js';
import {renderBranch} from './branch-view.js';
import {renderSwitch} from './switch-view.js';
import {encodePath,decodePath} from './tree.js';
export {encodePath,decodePath} from './tree.js';
import {escapeHtml} from './html.js';
export {escapeHtml} from './html.js';
import {explicitTypes,renderExplicitCommand,renderInlinePalette} from './command-view.js';
import {conditionOptions, optionFor, valuesFor, conditionQuestion} from './condition-options.js';
import {cellProperties, passage} from './rules.js';
// Somente representação: regras e interpretação permanecem fora do DOM.
export const labels = {move:'Avançar', turnLeft:'Virar à esquerda', turnRight:'Virar à direita'};
const icons = {move:'↑', turnLeft:'↶', turnRight:'↷'};
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const prefix = (path, full) => full && path.every((part, i) => full[i] === part) && full.length >= path.length;
export function renderProgram(program, mission, execution, target, disabled, basePath = []) {
  return program.map((node, index) => {
    const path = [...basePath, index], key = encodePath(path), active = same(path, execution.activePath);
    const controls = `<div class="row-controls"><button data-edit="up" data-path="${key}" aria-label="Mover bloco ${index + 1} para cima" ${disabled || index === 0 ? 'disabled' : ''}>↑</button><button data-edit="down" data-path="${key}" aria-label="Mover bloco ${index + 1} para baixo" ${disabled || index === program.length - 1 ? 'disabled' : ''}>↓</button><button data-edit="remove" data-path="${key}" aria-label="Remover bloco ${index + 1}" ${disabled ? 'disabled' : ''}>×</button></div>`;
    if(['for','while'].includes(node.type))return renderLoop({mission,node,path,key,controls,execution,target,disabled,branch:renderBranch,render:(list,path)=>renderProgram(list,mission,execution,target,disabled,path)});
    if(node.type==='switch')return renderSwitch({mission,node,path,key,controls,execution,target,disabled,render:(list,path)=>renderProgram(list,mission,execution,target,disabled,path)});
    if(explicitTypes.includes(node.type))return renderExplicitCommand(mission,node,key,controls,active,disabled);
    if (node.type !== 'if') return `<li class="command ${node.type} ${active ? 'active' : ''}" ${active ? 'aria-current="step"' : ''}><span class="command-number">${index + 1}</span><b>${icons[node.type]}</b><span>${labels[node.type]}</span>${controls}</li>`;
    const within = prefix(path, execution.activePath), condition = node.condition;
    const chosen = active && same(execution.decision?.path, path) ? execution.decision.branch : within ? execution.activePath[path.length] : null;
    const option = optionFor(mission,condition);
    const fields = renderConditionFields(mission,condition,key,disabled);
    const options = conditionOptions(mission).map(choice=>`<option value="${escapeHtml(choice.id)}" ${choice.id===option?.id?'selected':''}>${escapeHtml(choice.label)}</option>`).join('');
    const branches=['then','else'].map(branch=>renderBranch({mission,list:node[branch],path:[...path,branch],label:branch==='then'?'ENTÃO':'SENÃO',target,chosen:chosen===branch,deciding:!!chosen,disabled,kind:branch,render:(list,path)=>renderProgram(list,mission,execution,target,disabled,path)})).join('');
    return `<li class="condition-block ${within ? 'active-block' : ''} ${active ? 'active' : ''}" ${active ? 'aria-current="step"' : ''}><div class="condition-heading"><strong>SE</strong><span>Bloco ${index + 1}</span>${controls}</div><label class="condition-choice">Pergunta<select data-field="condition" data-path="${key}" ${disabled ? 'disabled' : ''}>${options}</select></label>${fields}${branches}</li>`;
  }).join('');
}
export function renderBoard(mission,state,activeNode=null,visualOptions={}) {
  return renderSceneBoard(mission,state,activeNode,visualOptions);
}

export function renderConditionFields(mission,condition,key,disabled) {
  const option = optionFor(mission,condition), values = option ? valuesFor(option) : [];
  const lock = disabled ? 'disabled' : '';
  if (values.length) return `<label class="value-fields">Resposta a procurar<select data-field="value-choice" data-path="${key}" ${lock}>${values.map((value,index)=>`<option value="${index}" ${value.value===condition.value?'selected':''}>${escapeHtml(value.label)}</option>`).join('')}</select></label>`;
  if (condition.type==='stateAtLeast') {
    const variables = mission.conditionOptions ? [option.condition.variable] : [...Object.keys(mission.initialVariables??{}).filter(key=>typeof mission.initialVariables[key]==='number'),'collectedCount'];
    return `<div class="threshold-fields"><label>Contador<select data-field="variable" data-path="${key}" ${lock}>${variables.map(name=>`<option value="${escapeHtml(name)}" ${name===condition.variable?'selected':''}>${escapeHtml(name==='collectedCount'?'Objetos coletados':mission.presentation?.variables?.[name]??'Contador')}</option>`).join('')}</select></label><label>Pelo menos<input type="number" inputmode="numeric" min="0" max="99" step="1" value="${condition.value}" data-field="threshold" data-path="${key}" ${lock}></label></div>`;
  }
  return typeof condition.value==='number' ? `<label class="value-fields">Quantidade exata<input type="number" inputmode="decimal" step="any" value="${condition.value}" data-field="exact-value" data-path="${key}" ${lock}></label>` : '';
}
function propertyVisual(mission,name,value) {
  const visual=mission.presentation?.properties?.[name]??{};
  return {label:visual.label??'Marca', ...(visual.values?.find(v=>v.value===value)??{label:'Marca',glyph:'◇'})};
}
export function worldIndicators(mission,state) {
  return (mission.presentation?.stateIndicators??[]).map(indicator=>{
    const value=state.variables[indicator.variable];
    const label=indicator.values?.find(option=>option.value===value)?.label??(typeof value==='boolean'?(value?'Sim':'Não'):String(value));
    return `${indicator.label}: ${label}`;
  }).join(' · ');
}
export function eventMessages(mission,state) {
  const messages=[];
  for (const event of state.events) {
    const visual=mission.presentation?.entities?.[event.entityId]??{};
    if (event.type==='entityEntered' && visual.messages?.entered) messages.push(visual.messages.entered);
    if (event.type==='collected') messages.push(visual.messages?.collected??'Boa descoberta! Você coletou um objeto.');
    if (event.type==='effectCondition' && visual.guardMessages?.[String(event.result)]) messages.push(visual.guardMessages[String(event.result)]);
    if (event.type==='variableChanged' && event.previous!==event.value) {
      const message=mission.presentation?.stateMessages?.[event.variable]?.find(item=>item.value===event.value)?.message;
      if (message) messages.push(message);
    }
    if (event.type==='barrierChanged') messages.push(`${mission.presentation?.barriers?.[event.barrierId]?.label??'Passagem'}: ${event.passable?'passagem liberada':'passagem fechada'}.`);
    if (event.type==='condition') messages.push(`${conditionQuestion(mission,event.condition)} ${event.result?'Sim':'Não'} → ${event.result?'ENTÃO':'SENÃO'}.`);
  }
  return [...new Set(messages)];
}
export function describeEnvironment(mission,state) {
  const features=(mission.grid.cells??[]).map(cell=>`${Object.entries(cellProperties(mission,state,cell)).map(([name,value])=>`${mission.presentation?.properties?.[name]?.label??'Marca'}: ${propertyVisual(mission,name,value).label}`).join(', ')} na linha ${cell.row+1}, coluna ${cell.col+1}`);
  const barriers=(mission.barriers??[]).map(b=>`${mission.presentation?.barriers?.[b.id]?.label??'Passagem'} ${passage(mission,state,b).passable?'livre':'fechada'} na linha ${b.row+1}, coluna ${b.col+1}`);
  const entities=(mission.entities??[]).filter(e=>!state.consumedIds?.includes(e.id)&&(!e.collectible||!state.collectedIds.includes(e.id))).map(e=>`${mission.presentation?.entities?.[e.id]?.label??mission.presentation?.entityLabel??'Objeto'} na linha ${e.row+1}, coluna ${e.col+1}`);
  return [...features,...barriers,...entities].join('; ');
}
