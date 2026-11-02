import {objectProperties} from '../properties.js';
// Observação é exibida a partir da memória, nunca relendo um segredo do mundo.
export function presentedProperties(object,state,descriptor={}){
 const result=objectProperties(object,state);
 for(const [property,memory]of Object.entries(descriptor.observedProperties??{}))if(Object.hasOwn(result,property))result[property]=state.memory?.[memory]?.known?state.memory[memory].value:'?';
 return result;
}
export function observationPending(descriptor={},state){return Object.values(descriptor.observedProperties??{}).some(name=>!state.memory?.[name]?.known);}
export function hasConcealedInformation(mission){const visual=mission.presentation?.visual??{};return ['entities','barriers','properties'].some(kind=>Object.values(visual[kind]??{}).some(d=>Object.keys(d.observedProperties??{}).length));}
export function variantName(mission,index){return hasConcealedInformation(mission)?`Versão ${index+1}`:mission.variantLabel??`Versão ${index+1}`;}
export function mapDetails(descriptor,state,properties){return (descriptor?.details??[]).map(d=>{const value=d.source==='property'?properties[d.name]:state.variables[d.name];const text=typeof value==='boolean'?(value?'Sim':'Não'):['string','number'].includes(typeof value)?String(value):'?';return `${d.label?d.label+': ':''}${text}`;});}
export function presentedState(object,state,descriptor={}){
 const variables={...state.variables};
 for(const [property,memory]of Object.entries(descriptor.observedProperties??{})){
  const binding=object?.properties?.[property];if(binding&&typeof binding==='object'&&typeof binding.stateVariable==='string')variables[binding.stateVariable]=state.memory?.[memory]?.known?state.memory[memory].value:'?';
 }
 return {...state,variables};
}
