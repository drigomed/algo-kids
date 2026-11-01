import {record,scalar,validVariable} from './data.js';
export function validateProperties(properties={},variables={},path='properties') {
  if(!record(properties))throw new Error(`${path}: propriedades inválidas`);
  for(const [name,value] of Object.entries(properties)) {
    if(!validVariable(name))throw new Error(`${path}.${name}: nome inválido`);
    if(!scalar(value)&&(!record(value)||Object.keys(value).length!==1||!validVariable(value.stateVariable)||!Object.hasOwn(variables,value.stateVariable)))throw new Error(`${path}.${name}: valor ou vínculo inválido`);
  }
}
export function propertyType(properties,name,variables) {
  if(!Object.hasOwn(properties??{},name))return undefined;
  const value=properties[name];return typeof (scalar(value)?value:variables[value.stateVariable]);
}
export function objectProperties(object,state) {
  return Object.fromEntries(Object.entries(object?.properties??{}).map(([name,value])=>[name,scalar(value)?value:state.variables[value.stateVariable]]));
}
