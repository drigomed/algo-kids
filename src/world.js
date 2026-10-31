import {directions, frontCell, pathClear, victory, validVariable, scalar, validateAction, validateCondition, applyActions} from './rules.js';
export {directions} from './rules.js';
export const terminal = state => ['won', 'collision', 'finished', 'limit'].includes(state.status);
export function validateMission(m) {
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
  for (const [name, value] of Object.entries(variables)) if (!validVariable(name) || !scalar(value)) throw new Error('Variável inicial inválida');
  if (m.entities !== undefined && !Array.isArray(m.entities)) throw new Error('Entidades inválidas');
  const ids = new Set();
  for (const entity of m.entities ?? []) {
    if (!entity || typeof entity.id !== 'string' || !entity.id || ids.has(entity.id) || !inside(entity) || blocked.has(`${entity.row},${entity.col}`) || typeof entity.collectible !== 'boolean' || !Array.isArray(entity.onEnter)) throw new Error('Entidade inválida');
    ids.add(entity.id);
    entity.onEnter.forEach(action => validateAction(action, variables));
  }
  if (m.winCondition) validateCondition(m.winCondition, variables);
  return true;
}
export function initialState(m) {
  validateMission(m);
  const state = {...m.start, variables: {...m.initialVariables}, collectedIds: [], collectedCount: 0, status: 'ready', instructionPointer: 0, events: [], lastEvent: 'ready'};
  if (victory(m, state)) state.status = 'won';
  return state;
}
export function applyCommand(m, state, command) {
  if (terminal(state)) return state;
  const next = {...state, variables: {...state.variables}, collectedIds: [...state.collectedIds], events: [], status: 'running', instructionPointer: state.instructionPointer + 1};
  const i = directions.indexOf(state.direction);
  if (command.type === 'turnLeft' || command.type === 'turnRight') {
    next.direction = directions[(i + (command.type === 'turnLeft' ? 3 : 1)) % 4];
    next.lastEvent = command.type;
    next.events.push({type: 'turned', direction: next.direction});
  } else if (command.type === 'move') {
    const p = frontCell(state);
    if (!pathClear(m, state)) {
      const boundary = p.row < 0 || p.col < 0 || p.row >= m.grid.height || p.col >= m.grid.width;
      return {...next, status: 'collision', lastEvent: boundary ? 'boundary' : 'obstacle', events: [{type: 'collision', reason: boundary ? 'boundary' : 'obstacle'}]};
    }
    Object.assign(next, p, {lastEvent: 'move'});
    next.events.push({type: 'moved', ...p});
    for (const entity of m.entities ?? []) {
      if (entity.row !== p.row || entity.col !== p.col || (entity.collectible && next.collectedIds.includes(entity.id))) continue;
      next.events.push({type: 'entityEntered', entityId: entity.id});
      const effects = applyActions(next.variables, entity.onEnter);
      next.variables = effects.variables;
      next.events.push(...effects.events);
      if (entity.collectible) {
        next.collectedIds.push(entity.id);
        next.collectedCount = next.collectedIds.length;
        next.events.push({type: 'collected', entityId: entity.id, count: next.collectedCount});
      }
    }
  } else throw new Error('Comando desconhecido');
  if (victory(m, next)) {
    next.status = 'won'; next.lastEvent = 'won'; next.events.push({type: 'won'});
  } else if (next.row === m.goal.row && next.col === m.goal.col) next.events.push({type: 'goalIncomplete'});
  return next;
}
