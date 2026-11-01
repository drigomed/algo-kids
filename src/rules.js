import {validVariable,scalar,record} from './data.js';
export {validVariable,scalar,record} from './data.js';
import {validateMemoryComparison,readMemory} from './memory.js';
// Regras declarativas: nenhuma entidade, imagem ou variável específica do jogo.
export const directions = ['N', 'L', 'S', 'O'];
const vectors = [[-1, 0], [0, 1], [1, 0], [0, -1]];
export function frontCell(state) {
  const [dr, dc] = vectors[directions.indexOf(state.direction)];
  return {row: state.row + dr, col: state.col + dc};
}
export function passage(mission, state, position) {
  const p = position;
  if (p.row < 0 || p.col < 0 || p.row >= mission.grid.height || p.col >= mission.grid.width) return {passable:false, reason:'boundary'};
  if (mission.grid.obstacles.some(o => o.row === p.row && o.col === p.col)) return {passable:false, reason:'obstacle'};
  const barrier = (mission.barriers ?? []).find(b => b.row === p.row && b.col === p.col && !evaluateCondition(mission, state, b.passableWhen));
  return barrier ? {passable:false, reason:'barrier', barrierId:barrier.id} : {passable:true};
}
export function pathClear(mission, state) { return passage(mission, state, frontCell(state)).passable; }
export function cellProperties(mission, state, position) {
  const cell = (mission.grid.cells ?? []).find(c => c.row === position.row && c.col === position.col);
  return Object.fromEntries(Object.entries(cell?.properties ?? {}).map(([key,value]) => [key, scalar(value) ? value : state.variables[value.stateVariable]]));
}
function fields(value, allowed) {
  if (!record(value) || Object.keys(value).some(key => !allowed.includes(key))) throw new Error('Campos de regra inválidos');
}
export function validateCondition(condition, variables, depth = 0, memory = {}) {
  if (!record(condition) || depth > 8) throw new Error('Condição inválida');
  switch (condition.type) {
    case 'pathClear': case 'atGoal': fields(condition, ['type']); return;
    case 'stateAtLeast':
      fields(condition, ['type','variable','value']);
      if ((condition.variable !== 'collectedCount' && (!validVariable(condition.variable) || !Object.hasOwn(variables, condition.variable) || typeof variables[condition.variable] !== 'number')) || !Number.isFinite(condition.value)) throw new Error('Variável numérica ou limite inválido');
      return;
    case 'memoryEquals':
      fields(condition,['type','variable','value']);
      validateMemoryComparison(condition,memory);return;
    case 'stateEquals':
      fields(condition, ['type','variable','value']);
      if (!validVariable(condition.variable) || !Object.hasOwn(variables, condition.variable) || !scalar(condition.value) || typeof condition.value !== typeof variables[condition.variable]) throw new Error('Comparação de estado inválida');
      return;
    case 'cellPropertyEquals':
      fields(condition, ['type','relativeTo','property','value']);
      if (condition.relativeTo !== 'front' || !validVariable(condition.property) || !scalar(condition.value)) throw new Error('Sensor inválido');
      return;
    case 'all':
      fields(condition, ['type','conditions']);
      if (!Array.isArray(condition.conditions) || !condition.conditions.length || condition.conditions.length > 20) throw new Error('Condições compostas inválidas');
      condition.conditions.forEach(c => validateCondition(c, variables, depth + 1, memory));
      return;
    default: throw new Error('Tipo de condição desconhecido');
  }
}
export function evaluateCondition(mission, state, condition) {
  switch (condition.type) {
    case 'pathClear': return pathClear(mission, state);
    case 'stateAtLeast': return (condition.variable === 'collectedCount' ? state.collectedCount : state.variables[condition.variable]) >= condition.value;
    case 'memoryEquals': return readMemory(state,condition.variable) === condition.value;
    case 'stateEquals': return state.variables[condition.variable] === condition.value;
    case 'cellPropertyEquals': {
      const p = frontCell(state);
      if (p.row < 0 || p.col < 0 || p.row >= mission.grid.height || p.col >= mission.grid.width) return false;
      const properties = cellProperties(mission, state, p);
      return Object.hasOwn(properties, condition.property) && properties[condition.property] === condition.value;
    }
    case 'atGoal': return state.row === mission.goal.row && state.col === mission.goal.col;
    case 'all': return condition.conditions.every(c => evaluateCondition(mission, state, c));
    default: throw new Error('Tipo de condição desconhecido');
  }
}
export function validateAction(action, variables) {
  fields(action, action?.type === 'increment' ? ['type','variable','amount'] : ['type','variable','value']);
  if (!action || !validVariable(action.variable) || !Object.hasOwn(variables, action.variable)) throw new Error('Variável de ação não declarada');
  if (action.type === 'increment') {
    if (typeof variables[action.variable] !== 'number' || !Number.isFinite(action.amount)) throw new Error('Incremento inválido');
  } else if (action.type === 'set') {
    if (!scalar(action.value) || typeof action.value !== typeof variables[action.variable]) throw new Error('Valor de ação inválido');
  } else throw new Error('Ação desconhecida');
}
export function applyActions(variables, actions) {
  const next = {...variables}, events = [];
  for (const action of actions) {
    validateAction(action, next);
    const previous = next[action.variable];
    const value = action.type === 'increment' ? previous + action.amount : action.value;
    if (!scalar(value)) throw new Error('Resultado de ação inválido');
    next[action.variable] = value;
    events.push({type: 'variableChanged', variable: action.variable, previous, value});
  }
  return {variables: next, events};
}
export function victory(mission, state) {
  // O destino é sempre necessário, mesmo quando a missão define outra condição.
  return evaluateCondition(mission, state, {type: 'atGoal'}) &&
    (!mission.winCondition || evaluateCondition(mission, state, mission.winCondition));
}

export function validatePassageCondition(condition, variables) {
  validateCondition(condition, variables);
  if (condition.type === 'all') condition.conditions.forEach(c => validatePassageCondition(c, variables));
  else if (!['stateEquals','stateAtLeast'].includes(condition.type)) throw new Error('Passagem exige condição de estado sem sensores');
}
export function validateEffects(effects, variables, depth = 0, budget = {count:0}, memory = {}) {
  if (!Array.isArray(effects) || depth > 8) throw new Error('Efeitos inválidos');
  for (const effect of effects) {
    if (++budget.count > 200) throw new Error('Muitos efeitos');
    if (record(effect) && Object.hasOwn(effect, 'when')) {
      fields(effect, ['when','actions']);
      validateCondition(effect.when, variables, 0, memory);
      validateEffects(effect.actions, variables, depth + 1, budget, memory);
    } else validateAction(effect, variables);
  }
}
export function applyEffects(mission, state, effects) {
  let current = {...state, variables:{...state.variables}};
  const events = [];
  function visit(list) {
    for (const effect of list) {
      if (Object.hasOwn(effect, 'when')) {
        const result = evaluateCondition(mission, current, effect.when);
        events.push({type:'effectCondition', condition:structuredClone(effect.when), result});
        if (result) visit(effect.actions);
      } else {
        const previous = current;
        const applied = applyActions(current.variables, [effect]);
        current = {...current, variables:applied.variables};
        events.push(...applied.events);
        events.push(...barrierChanges(mission,previous,current));
      }
    }
  }
  visit(effects);
  return {variables:current.variables, events};
}
export function barrierChanges(mission, before, after) {
  return (mission.barriers ?? []).flatMap(barrier => {
    const passable = evaluateCondition(mission,after,barrier.passableWhen);
    return passable === evaluateCondition(mission,before,barrier.passableWhen) ? [] : [{type:'barrierChanged',barrierId:barrier.id,passable}];
  });
}
