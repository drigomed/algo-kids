import {objectProperties} from './properties.js';
import {record,validVariable,ExecutionFault,actionFailure} from './data.js';
import {memoryValue,validateMemoryComparison} from './memory.js';
import {frontCell,cellProperties,evaluateCondition,validateCondition,validateEffects,applyEffects} from './rules.js';
export const explicitTypes=['inspect','setMemory','interact'];
export function commandReach(state,node) {
  const relativeTo=node.type==='inspect'?node.source.relativeTo:node.type==='interact'?node.relativeTo:null;
  return relativeTo==='here'?{row:state.row,col:state.col}:relativeTo==='front'?frontCell(state):null;
}
function fields(node,keys) { if(!record(node)||Object.keys(node).some(key=>!keys.includes(key)))throw new Error('Comando: campos inválidos'); }
export function validateCommandShape(node,mission) {
  if(node?.type==='inspect') {
    fields(node,['type','source','into']);fields(node.source,['type','relativeTo','property','entityId','barrierId']);
    const source=node.source;
    if(!['cellProperty','entityProperty','barrierProperty'].includes(source.type)||!['front','here'].includes(source.relativeTo)||(source.type==='cellProperty'&&source.relativeTo!=='front')||!validVariable(source.property)||!validVariable(node.into)||!Object.hasOwn(mission.robotMemory??{},node.into))throw new Error('inspect: fonte ou memória inválida');
    if((source.entityId!==undefined&&(source.type!=='entityProperty'||!validSelector(source.entityId)))||(source.barrierId!==undefined&&(source.type!=='barrierProperty'||!validSelector(source.barrierId))))throw new Error('inspect: seletor inválido');
  } else if(node?.type==='setMemory') {
    fields(node,['type','variable','value']);validateMemoryComparison(node,mission.robotMemory??{});
  } else if(node?.type==='interact') {
    fields(node,['type','relativeTo','actionId','entityId']);
    if(!['front','here'].includes(node.relativeTo)||!validVariable(node.actionId)||(node.entityId!==undefined&&!validSelector(node.entityId)))throw new Error('interact: alcance ou ação inválida');
  } else throw new Error('Comando explícito desconhecido');
}
function matches(node,template) {
  return node.type===template.type && (node.type==='inspect' ? node.into===template.into&&node.source.type===template.source.type&&node.source.relativeTo===template.source.relativeTo&&node.source.property===template.source.property&&node.source.entityId===template.source.entityId&&node.source.barrierId===template.source.barrierId : node.type==='setMemory' ? node.variable===template.variable : node.relativeTo===template.relativeTo&&node.actionId===template.actionId&&node.entityId===template.entityId);
}
export function commandOption(mission,node) { return (mission.commandOptions??[]).find(option=>matches(node,option.node)&&(node.type!=='setMemory'||(option.values??[{value:option.node.value}]).some(item=>item.value===node.value))); }
export function validateCommand(node,mission) {
  validateCommandShape(node,mission);
  const option=commandOption(mission,node);
  if(!option||(node.type==='setMemory'&&!(option.values??[{value:option.node.value}]).some(item=>item.value===node.value)))throw new Error('Comando não autorizado nesta missão');
}
export function validateCommandOptions(mission) {
  if(mission.commandOptions===undefined)return;
  if(!Array.isArray(mission.commandOptions)||mission.commandOptions.length>30)throw new Error('commandOptions: lista inválida');
  const ids=new Set(),commands=new Set();
  for(const option of mission.commandOptions) {
    if(!record(option)||!validVariable(option.id)||ids.has(option.id)||typeof option.label!=='string'||!option.label.trim())throw new Error('commandOptions: opção inválida');
    ids.add(option.id);validateCommandShape(option.node,mission);
    if(option.values!==undefined) {
      if(option.node.type!=='setMemory'||!Array.isArray(option.values)||!option.values.length||option.values.length>30)throw new Error('commandOptions: valores inválidos');
      const values=new Set();
      for(const item of option.values) {
        if(!record(item)||typeof item.label!=='string'||!item.label.trim()||values.has(item.value))throw new Error('commandOptions: resposta inválida');
        validateCommandShape({...option.node,value:item.value},mission);values.add(item.value);
      }
      if(!values.has(option.node.value))throw new Error('commandOptions: valor inicial não autorizado');
    }
    for(const node of option.node.type==='setMemory'?(option.values??[{value:option.node.value}]).map(item=>({...option.node,value:item.value})):[option.node]) {
      const key=JSON.stringify([node.type,node.variable,node.value,node.into,node.source?.type,node.source?.relativeTo,node.source?.property,node.relativeTo,node.actionId,node.entityId,node.source?.entityId,node.source?.barrierId]);
      if(commands.has(key))throw new Error('commandOptions: comandos ambíguos');
      commands.add(key);
    }
  }
}
export function configureCommand(mission,id,valueIndex) {
  const option=(mission.commandOptions??[]).find(option=>option.id===id);
  if(!option)throw new Error('Escolha um comando disponível.');
  const node=structuredClone(option.node);
  if(valueIndex!==undefined) {
    if(!Number.isInteger(valueIndex)||!option.values?.[valueIndex])throw new Error('Escolha um valor disponível.');
    node.value=option.values[valueIndex].value;
  }
  validateCommand(node,mission);return node;
}
export function validateInteractions(entity,mission) {
  if(entity.interactions===undefined)return;
  if(!Array.isArray(entity.interactions)||entity.interactions.length>20)throw new Error('interactions: lista inválida');
  const ids=new Set();
  for(const action of entity.interactions) {
    fields(action,['id','relativeTo','once','when','effects','consume']);
    if(!validVariable(action.id)||ids.has(action.id)||!Array.isArray(action.relativeTo)||!action.relativeTo.length||new Set(action.relativeTo).size!==action.relativeTo.length||action.relativeTo.some(value=>!['front','here'].includes(value))||(action.once!==undefined&&typeof action.once!=='boolean')||(action.consume!==undefined&&typeof action.consume!=='boolean'))throw new Error('interactions: ação inválida');
    ids.add(action.id);
    if(action.when!==undefined)validateCondition(action.when,mission.initialVariables??{},0,mission.robotMemory??{});
    validateEffects(action.effects,mission.initialVariables??{},0,{count:0},mission.robotMemory??{});
  }
}
function validSelector(value) {return typeof value==='string'&&value.length>0&&value.length<=128;}
export function entityAvailable(state,entity) {return !state.consumedIds?.includes(entity.id)&&!state.collectedIds.includes(entity.id);}
export function objectsInReach(mission,state,node,kind='entity',selector) {
  const position=commandReach(state,node);
  if(!position||position.row<0||position.col<0||position.row>=mission.grid.height||position.col>=mission.grid.width)throw new ExecutionFault('outOfReach');
  const all=(kind==='barrier'?mission.barriers:mission.entities)??[];
  const selected=all.filter(object=>selector===undefined||object.id===selector);
  const nearby=selected.filter(object=>object.row===position.row&&object.col===position.col);
  const available=nearby.filter(object=>kind==='barrier'||entityAvailable(state,object));
  return {position,selected,nearby,available};
}
export function resolveInspection(mission,state,node) {
  if(node.source.type==='cellProperty') {
    const position=commandReach(state,node);
    if(position.row<0||position.col<0||position.row>=mission.grid.height||position.col>=mission.grid.width)throw new ExecutionFault('outOfReach');
    return {position,properties:cellProperties(mission,state,position)};
  }
  const barrier=node.source.type==='barrierProperty';
  const found=objectsInReach(mission,state,node,barrier?'barrier':'entity',barrier?node.source.barrierId:node.source.entityId);
  if(found.available.length>1)throw new ExecutionFault('ambiguousTarget');
  if(!found.available.length)throw new ExecutionFault(found.nearby.length?'targetConsumed':found.selected.length?'outOfReach':'targetMissing');
  const object=found.available[0];
  return {position:found.position,properties:objectProperties(object,state),...(barrier?{barrierId:object.id}:{entityId:object.id})};
}
export function resolveTarget(mission,state,node) {
  const found=objectsInReach(mission,state,node,'entity',node.entityId);
  const matching=entities=>entities.flatMap(entity=>(entity.interactions??[]).filter(action=>action.id===node.actionId&&action.relativeTo.includes(node.relativeTo)).map(action=>({entity,action})));
  const candidates=matching(found.available);
  if(candidates.length>1)throw new ExecutionFault('ambiguousTarget');
  if(!candidates.length) {
    const unavailable=matching(found.nearby.filter(entity=>!entityAvailable(state,entity)));
    if(unavailable.length===1) {
      const {entity,action}=unavailable[0],key=JSON.stringify([entity.id,action.id]);
      throw new ExecutionFault(action.once&&state.usedInteractions.includes(key)?'alreadyUsed':'targetConsumed',{entityId:entity.id});
    }
    const elsewhere=found.selected.some(entity=>entity.interactions?.some(action=>action.id===node.actionId));
    throw new ExecutionFault(found.available.length?'incompatibleTarget':elsewhere?'outOfReach':'targetMissing');
  }
  return {...candidates[0],position:found.position};
}
export function executeExplicit(mission,state,node) {
  validateCommand(node,mission);
  let details={action:node.type};
  try {
    if(node.type==='inspect'||node.type==='setMemory') {
      const variable=node.type==='inspect'?node.into:node.variable;
      const previous=state.memory[variable];let value=node.value;
      details={...details,variable,previous:structuredClone(previous),...(node.source?{source:structuredClone(node.source)}:{}),value:null};
      if(node.type==='inspect') {
        const observed=resolveInspection(mission,state,node);
        const {properties,position,...target}=observed;
        if(node.source.type!=='cellProperty')details={...details,target:position,...target};
        if(!Object.hasOwn(properties,node.source.property))throw new ExecutionFault('propertyMissing');
        value=properties[node.source.property];
      }
      details={...details,value};
      if(!memoryValue(mission.robotMemory[variable].type,value))throw new ExecutionFault('typeMismatch');
      const event={type:node.type==='inspect'?'inspected':'memoryWritten',...details,value,success:true};
      return {...state,memory:{...state.memory,[variable]:{known:true,value}},lastEvent:event.type,events:[event]};
    }
    const {entity,action,position}=resolveTarget(mission,state,node);
    details={...details,entityId:entity.id,actionId:action.id,relativeTo:node.relativeTo,target:position};
    const key=JSON.stringify([entity.id,action.id]);
    if(action.once&&state.usedInteractions.includes(key))throw new ExecutionFault('alreadyUsed');
    if(state.consumedIds.includes(entity.id)||state.collectedIds.includes(entity.id))throw new ExecutionFault('targetConsumed');
    if(action.when&&!evaluateCondition(mission,state,action.when))throw new ExecutionFault('preconditionFailed');
    // applyEffects produz uma cópia: nenhum efeito ou evento parcial é publicado em falha.
    const applied=applyEffects(mission,state,action.effects);
    const consumedIds=action.consume?[...state.consumedIds,entity.id]:[...state.consumedIds];
    return {...state,variables:applied.variables,consumedIds,usedInteractions:action.once?[...state.usedInteractions,key]:[...state.usedInteractions],lastEvent:'interacted',events:[{type:'interacted',...details,success:true},...applied.events.map(event=>({...event,entityId:entity.id})),...(action.consume?[{type:'entityConsumed',entityId:entity.id}]:[])]};
  } catch(error) {
    return actionFailure(state,error instanceof ExecutionFault?error.reason:'effectFailed',{...details,...(error.details??{})});
  }
}
