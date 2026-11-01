import {switchOption} from './switches.js';
export function selectorLabel(mission,selector) {
  return selector.kind==='memoryVariable'?mission.presentation?.memory?.[selector.name]?.label??'Informação guardada':selector.name==='collectedCount'?'Objetos coletados':mission.presentation?.variables?.[selector.name]??'Valor do mundo';
}
export function selectedLabel(mission,node,selected) {
  const option=switchOption(mission,node);
  return selected.kind==='default'?option?.defaultLabel??'OUTRO VALOR':option?.cases[selected.index]?.label??`Caso ${selected.index+1}`;
}
export function switchNarrative(mission,event) {
  const values=event.selector.kind==='memoryVariable'?mission.presentation?.memory?.[event.selector.name]?.values:mission.presentation?.stateIndicators?.find(item=>item.variable===event.selector.name)?.values;
  const value=values?.find(item=>item.value===event.value)?.label??(typeof event.value==='boolean'?(event.value?'Sim':'Não'):event.value===''?'Texto vazio':String(event.value));
  const label=selectedLabel(mission,{selector:event.selector},event.selected);
  return {source:`${event.selector.kind==='memoryVariable'?'Na memória':'No mundo'}: ${selectorLabel(mission,event.selector)} = ${value}`,comparison:event.selected.kind==='default'?`Sem caso correspondente: ${label}`:`Encontrei o caso ${label}`,branch:`Executar somente ${label}`};
}
