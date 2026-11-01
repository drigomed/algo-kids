import {validateLoopOptions,loopPermissions} from './loops.js';
import {validateSwitchOptions,switchPermissions} from './switches.js';
import {validateProperties} from './properties.js';
import {assertJsonData,ExecutionFault,actionFailure} from './data.js';
import {validateMemory,initialMemory} from './memory.js';
import {explicitTypes,validateCommandOptions,validateInteractions,executeExplicit} from './commands.js';
import {validateConditionOptions} from './condition-options.js';
import {directions, frontCell, passage, victory, validVariable, scalar, record, validateEffects, validateCondition, validatePassageCondition, applyEffects, barrierChanges} from './rules.js';
export {directions} from './rules.js';
export const terminal = state => ['won', 'collision', 'finished', 'limit', 'actionFailed', 'stalled', 'stopped'].includes(state.status);
export function validateMission(m, {checkVariants=true} = {}) {
  assertJsonData(m, 'mission');
  validateMemory(m.robotMemory);
  if (!m?.grid || !Array.isArray(m.grid.obstacles)) throw new Error('Grade inválida');
  const inside = p => p && Number.isInteger(p.row) && Number.isInteger(p.col) && p.row >= 0 && p.col >= 0 && p.row < m.grid.height && p.col < m.grid.width;
  if (!Number.isInteger(m.grid.width) || !Number.isInteger(m.grid.height) || m.grid.width < 1 || m.grid.height < 1 || !inside(m.start) || !inside(m.goal) || !directions.includes(m.start.direction)) throw new Error('Missão inválida');
  const blocked = new Set();
  for (const o of m.grid.obstacles) {
    const key = `${o.row},${o.col}`;
    if (!inside(o) || blocked.has(key) || [m.start, m.goal].some(p => p.row === o.row && p.col === o.col)) throw new Error('Obstáculo inválido');
    blocked.add(key);
  }
  const variables = m.initialVariables ?? {};
  if (!record(variables)) throw new Error('Variáveis iniciais inválidas');
  for (const [name, value] of Object.entries(variables)) if (!validVariable(name) || !scalar(value)) throw new Error('Variável inicial inválida');
  if (m.entities !== undefined && !Array.isArray(m.entities)) throw new Error('Entidades inválidas');
  const ids = new Set();
  for (const entity of m.entities ?? []) {
    if (!entity || typeof entity.id !== 'string' || !entity.id || ids.has(entity.id) || !inside(entity) || blocked.has(`${entity.row},${entity.col}`) || typeof entity.collectible !== 'boolean' || !Array.isArray(entity.onEnter)) throw new Error('Entidade inválida');
    ids.add(entity.id);
    validateEffects(entity.onEnter, variables, 0, {count:0}, m.robotMemory??{});
    validateInteractions(entity,m);
    validateProperties(entity.properties,variables,`entities.${entity.id}.properties`);
  }
  if (m.barriers !== undefined && !Array.isArray(m.barriers)) throw new Error('Barreiras inválidas');
  const barrierCells = new Set();
  for (const barrier of m.barriers ?? []) {
    if (!barrier || typeof barrier.id !== 'string' || !barrier.id || ids.has(barrier.id) || !inside(barrier) || blocked.has(`${barrier.row},${barrier.col}`) || barrierCells.has(`${barrier.row},${barrier.col}`)) throw new Error('Barreira inválida');
    barrierCells.add(`${barrier.row},${barrier.col}`);
    ids.add(barrier.id);
    validateProperties(barrier.properties,variables,`barriers.${barrier.id}.properties`);
    if(barrier.failureCode!==undefined&&!validVariable(barrier.failureCode))throw new Error('barriers: failureCode inválido');
    validatePassageCondition(barrier.passableWhen, variables, barrier);
  }
  if (m.grid.cells !== undefined && !Array.isArray(m.grid.cells)) throw new Error('Casas observáveis inválidas');
  const cells = new Set();
  for (const cell of m.grid.cells ?? []) {
    const key = `${cell?.row},${cell?.col}`;
    if (!inside(cell) || cells.has(key) || !record(cell.properties)) throw new Error('Casa observável inválida');
    cells.add(key);
    validateProperties(cell.properties,variables,'grid.cells.properties');
  }
  validateCommandOptions(m);
  validateSwitchOptions(m);
  validateLoopOptions(m);
  validateConditionOptions(m);
  if (m.winCondition) validateCondition(m.winCondition, variables, 0, m.robotMemory??{});
  if(checkVariants && m.variants!==undefined) {
    if(!Array.isArray(m.variants)||!m.variants.length||m.variants.length>20)throw new Error('variants: lista inválida');
    const {variants,...base}=m, ids=new Set();
    for(const variant of variants) {
      if(!record(variant)||typeof variant.id!=='string'||!variant.id||ids.has(variant.id)||Object.hasOwn(variant,'variants'))throw new Error('variants: ID inválido ou variantes aninhadas');
      ids.add(variant.id);const resolved={...base,...variant,id:m.id};validateMission(resolved,{checkVariants:false});
      if(loopPermissions(resolved)!==loopPermissions(base))throw new Error('Variantes devem autorizar as mesmas repetições');
      if(switchPermissions(resolved)!==switchPermissions(base))throw new Error('Variantes devem autorizar a mesma ESCOLHA');
    }
  }
  return true;
}
export function initialState(m) {
  validateMission(m);
  const state = {...m.start, variables: {...m.initialVariables}, memory:initialMemory(m.robotMemory), usedInteractions:[], consumedIds:[], collectedIds: [], collectedCount: 0, status: 'ready', instructionPointer: 0, events: [], lastEvent: 'ready'};
  try { if (victory(m, state)) state.status = 'won'; }
  catch(error) { if(error instanceof ExecutionFault)return actionFailure(state,error.reason,error.details);throw error; }
  return state;
}
export function applyCommand(m, state, command) {
  if (terminal(state)) return state;
  let next = {...state, memory:state.memory??initialMemory(m.robotMemory), usedInteractions:state.usedInteractions??[], consumedIds:state.consumedIds??[], variables: {...state.variables}, collectedIds: [...state.collectedIds], events: [], status: 'running', instructionPointer: state.instructionPointer + 1};
  const i = directions.indexOf(state.direction);
  if(explicitTypes.includes(command.type)) {
    next=executeExplicit(m,next,command);
    if(next.status==='actionFailed')return next;
  } else if (command.type === 'turnLeft' || command.type === 'turnRight') {
    next.direction = directions[(i + (command.type === 'turnLeft' ? 3 : 1)) % 4];
    next.lastEvent = command.type;
    next.events.push({type: 'turned', direction: next.direction});
  } else if (command.type === 'move') {
    const p = frontCell(state);
    const access = passage(m, state, p);
    if (!access.passable) {
      const reason=access.failureCode??access.reason;
      const extra={...(access.barrierId?{barrierId:access.barrierId}:{}),...(access.failureCode?{failureCode:access.failureCode}:{}),...(access.actual!==undefined?{actual:access.actual,limit:access.limit,operator:access.operator}:{}),...(access.failureCode||access.actual!==undefined?{target:p}:{})};
      return {...next,status:'collision',lastEvent:access.reason,reason,...(access.barrierId?{barrierId:access.barrierId}:{}),events:[{type:'collision',reason,...extra}]};
    }
    Object.assign(next, p, {lastEvent: 'move'});
    next.events.push({type: 'moved', ...p});
    for (const entity of m.entities ?? []) {
      if (next.consumedIds.includes(entity.id) || entity.row !== p.row || entity.col !== p.col || (entity.collectible && next.collectedIds.includes(entity.id))) continue;
      next.events.push({type: 'entityEntered', entityId: entity.id});
      let effects;
      try { effects=applyEffects(m,next,entity.onEnter); }
      catch(error) { return actionFailure({...state,instructionPointer:next.instructionPointer},error instanceof ExecutionFault?error.reason:'effectFailed',{action:'move',entityId:entity.id,...(error.details??{})}); }
      next.variables = effects.variables;
      next.events.push(...effects.events.map(event=>({...event,entityId:entity.id})));
      if (entity.collectible) {
        const beforeCollection = {...next};
        next.collectedIds.push(entity.id);
        next.collectedCount = next.collectedIds.length;
        next.events.push({type: 'collected', entityId: entity.id, count: next.collectedCount});
        next.events.push(...barrierChanges(m,beforeCollection,next));
      }
    }
  } else throw new Error('Comando desconhecido');
  let won;
  try { won=victory(m,next); }
  catch(error) { if(error instanceof ExecutionFault)return actionFailure({...state,instructionPointer:next.instructionPointer},error.reason,error.details);throw error; }
  if (won) {
    next.status = 'won'; next.lastEvent = 'won'; next.events.push({type: 'won'});
  } else if (next.row === m.goal.row && next.col === m.goal.col) next.events.push({type: 'goalIncomplete'});
  return next;
}

export function classifyResult(state) {
  if(state.status==='won')return 'success';
  if(['collision','actionFailed','limit','stalled'].includes(state.status))return 'failure';
  if(state.status==='stopped')return 'interrupted';
  if(state.status==='finished')return 'incomplete';
  if(['ready','running'].includes(state.status))return 'inProgress';
  throw new Error('Estado de resultado desconhecido');
}
