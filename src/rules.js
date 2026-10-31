// Regras declarativas: nenhuma entidade, imagem ou variável específica do jogo.
export const directions = ['N', 'L', 'S', 'O'];
const vectors = [[-1, 0], [0, 1], [1, 0], [0, -1]];
const reserved = new Set(['__proto__', 'prototype', 'constructor', 'collectedCount']);
export function validVariable(name) {
  return typeof name === 'string' && /^[A-Za-z][A-Za-z0-9_]{0,39}$/.test(name) && !reserved.has(name);
}
export function scalar(value) {
  return ['string', 'boolean'].includes(typeof value) || (typeof value === 'number' && Number.isFinite(value));
}
export function frontCell(state) {
  const [dr, dc] = vectors[directions.indexOf(state.direction)];
  return {row: state.row + dr, col: state.col + dc};
}
export function pathClear(mission, state) {
  const p = frontCell(state);
  return p.row >= 0 && p.col >= 0 && p.row < mission.grid.height && p.col < mission.grid.width &&
    !mission.grid.obstacles.some(o => o.row === p.row && o.col === p.col);
}
export function validateCondition(condition, variables, depth = 0) {
  if (!condition || depth > 8) throw new Error('Condição inválida');
  switch (condition.type) {
    case 'pathClear': case 'atGoal': return;
    case 'stateAtLeast':
      if ((condition.variable !== 'collectedCount' && (!Object.hasOwn(variables, condition.variable) || typeof variables[condition.variable] !== 'number')) || !Number.isFinite(condition.value)) throw new Error('Variável numérica ou limite inválido');
      return;
    case 'all':
      if (!Array.isArray(condition.conditions) || !condition.conditions.length || condition.conditions.length > 20) throw new Error('Condições compostas inválidas');
      condition.conditions.forEach(c => validateCondition(c, variables, depth + 1));
      return;
    default: throw new Error('Tipo de condição desconhecido');
  }
}
export function evaluateCondition(mission, state, condition) {
  switch (condition.type) {
    case 'pathClear': return pathClear(mission, state);
    case 'stateAtLeast': return (condition.variable === 'collectedCount' ? state.collectedCount : state.variables[condition.variable]) >= condition.value;
    case 'atGoal': return state.row === mission.goal.row && state.col === mission.goal.col;
    case 'all': return condition.conditions.every(c => evaluateCondition(mission, state, c));
    default: throw new Error('Tipo de condição desconhecido');
  }
}
export function validateAction(action, variables) {
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
