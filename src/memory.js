import {record,validVariable,scalar,ExecutionFault} from './data.js';
export function memoryValue(type,value) { return scalar(value)&&typeof value===type&&(typeof value!=='string'||value.length<=128); }
export function validateMemory(definitions={}) {
  if(!record(definitions)||Object.keys(definitions).length>16)throw new Error('robotMemory: declare no máximo 16 variáveis');
  for(const [name,definition] of Object.entries(definitions)) {
    if(!validVariable(name)||!record(definition)||!['string','number','boolean'].includes(definition.type)||!Object.hasOwn(definition,'initial')||Object.keys(definition).some(key=>!['type','initial'].includes(key))||(definition.initial!==null&&!memoryValue(definition.type,definition.initial)))throw new Error(`robotMemory.${name}: declaração inválida`);
  }
}
export function initialMemory(definitions={}) { return Object.fromEntries(Object.entries(definitions).map(([name,d])=>[name,{known:d.initial!==null,value:d.initial}])); }
export function validateMemoryComparison(condition,definitions) {
  if(!validVariable(condition.variable)||!Object.hasOwn(definitions,condition.variable)||!memoryValue(definitions[condition.variable].type,condition.value))throw new Error('memoryEquals: variável ou valor incompatível');
}
export function readMemory(state,variable) {
  const item=state.memory?.[variable];
  if(!item?.known)throw new ExecutionFault('memoryUnknown',{variable});
  return item.value;
}
