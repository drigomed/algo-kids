import {record,validVariable,ExecutionFault,assertJsonData} from './data.js';
import {memoryValue,readMemory} from './memory.js';
export const MAX_CASES=8,MAX_SWITCH_OPTIONS=20;
function fields(value,allowed) {if(!record(value)||Object.keys(value).some(key=>!allowed.includes(key)))throw new Error('ESCOLHA: campos inválidos');}
const selectorKey=selector=>JSON.stringify([selector.kind,selector.name]);
export function selectorType(mission,selector) {
  fields(selector,['kind','name']);
  if(!validVariable(selector.name)&&!(selector.kind==='worldVariable'&&selector.name==='collectedCount'))throw new Error('ESCOLHA: nome de seletor inválido');
  if(selector.kind==='memoryVariable') {
    if(!Object.hasOwn(mission.robotMemory??{},selector.name))throw new Error('ESCOLHA: memória não declarada');
    return mission.robotMemory[selector.name].type;
  }
  if(selector.kind==='worldVariable') {
    if(selector.name==='collectedCount')return 'number';
    if(!Object.hasOwn(mission.initialVariables??{},selector.name))throw new Error('ESCOLHA: variável do mundo não declarada');
    return typeof mission.initialVariables[selector.name];
  }
  throw new Error('ESCOLHA: use memória ou variável do mundo');
}
export function validateSwitchOptions(mission) {
  if(!Object.hasOwn(mission,'switchOptions'))return;
  assertJsonData(mission,'mission');
  if(!Array.isArray(mission.switchOptions)||mission.switchOptions.length>MAX_SWITCH_OPTIONS)throw new Error('switchOptions: limite de 20 opções');
  const ids=new Set(),selectors=new Set();
  for(const option of mission.switchOptions) {
    fields(option,['id','label','selector','cases','defaultLabel']);
    if(!validVariable(option.id)||ids.has(option.id)||typeof option.label!=='string'||!option.label.trim()||(option.defaultLabel!==undefined&&(typeof option.defaultLabel!=='string'||!option.defaultLabel.trim())))throw new Error('switchOptions: rótulo ou ID inválido');
    ids.add(option.id);const type=selectorType(mission,option.selector),key=selectorKey(option.selector);
    if(selectors.has(key))throw new Error('switchOptions: seletor ambíguo');selectors.add(key);
    if(!Array.isArray(option.cases)||option.cases.length<2||option.cases.length>MAX_CASES)throw new Error('switchOptions: declare de 2 a 8 casos');
    const values=new Set();
    for(const item of option.cases) {
      fields(item,['value','label']);
      if(!memoryValue(type,item.value)||values.has(item.value)||typeof item.label!=='string'||!item.label.trim())throw new Error('switchOptions: caso duplicado ou incompatível');
      values.add(item.value);
    }
  }
}
export function switchOption(mission,node) {return (mission.switchOptions??[]).find(option=>selectorKey(option.selector)===selectorKey(node.selector));}
export function validateSwitchNode(mission,node) {
  assertJsonData(node,'switch');
  fields(node,['type','selector','cases','default']);
  if(node.type!=='switch')throw new Error('ESCOLHA: nó inválido');
  validateSwitchOptions(mission);selectorType(mission,node.selector);
  const option=switchOption(mission,node);
  if(!option||!Array.isArray(node.cases)||node.cases.length!==option.cases.length||!Array.isArray(node.default))throw new Error('ESCOLHA não autorizada ou ramo padrão ausente');
  node.cases.forEach((item,index)=>{
    fields(item,['value','body']);
    if(item.value!==option.cases[index].value||!Array.isArray(item.body))throw new Error('ESCOLHA: casos devem manter valores, ordem e sequências autorizadas');
  });
  return true;
}
export function createSwitch(mission,optionId) {
  assertJsonData(mission,'mission');
  validateSwitchOptions(mission);
  const option=(mission.switchOptions??[]).find(option=>option.id===optionId);
  if(!option)throw new Error('Escolha uma opção autorizada da missão.');
  return {type:'switch',selector:structuredClone(option.selector),cases:option.cases.map(item=>({value:item.value,body:[]})),default:[]};
}
export function evaluateSwitch(mission,state,node) {
  const type=selectorType(mission,node.selector);
  const value=node.selector.kind==='memoryVariable'?readMemory(state,node.selector.name):node.selector.name==='collectedCount'?state.collectedCount:state.variables[node.selector.name];
  if(!memoryValue(type,value))throw new ExecutionFault('typeMismatch');
  const index=node.cases.findIndex(item=>item.value===value);
  return {type:'switch',selector:structuredClone(node.selector),value,selected:index<0?{kind:'default'}:{kind:'case',index,value:node.cases[index].value}};
}
export function switchBranchPath(path,selected) {return selected.kind==='default'?[...path,'default']:[...path,'cases',selected.index,'body'];}
export function switchPermissions(mission) {return JSON.stringify((mission.switchOptions??[]).map(o=>[o.id,selectorKey(o.selector),o.cases.map(c=>c.value)]).sort((a,b)=>a[0].localeCompare(b[0])));}
export function switchHasCommands(node) {return node.cases.some(item=>item.body.length>0)||node.default.length>0;}
