import {validateDecision} from './condition-options.js';
import {initialState, applyCommand, terminal, validateMission} from './world.js';
import {evaluateCondition} from './rules.js';
export const MAX_NODES = 300, MAX_DEPTH = 8, DEFAULT_LIMIT = 1000;
export function validateProgram(program, mission) {
  const pending = [{list: program, depth: 0}];
  let count = 0;
  while (pending.length) {
    const {list, depth} = pending.pop();
    if (!Array.isArray(list) || depth > MAX_DEPTH) throw new Error('Programa muito profundo ou ramo inválido');
    for (const node of list) {
      if (++count > MAX_NODES || !node) throw new Error('Programa muito grande ou inválido');
      if (node.type === 'if') {
        validateDecision(node.condition, mission);
        pending.push({list: node.then, depth: depth + 1}, {list: node.else, depth: depth + 1});
      } else if (!['move', 'turnLeft', 'turnRight'].includes(node.type)) throw new Error('Instrução não suportada');
    }
  }
  return true;
}
export function createExecution(mission, program, {instructionLimit = DEFAULT_LIMIT} = {}) {
  validateMission(mission); validateProgram(program, mission);
  if (!Number.isInteger(instructionLimit) || instructionLimit < 1 || instructionLimit > 10000) throw new Error('Limite de instruções inválido');
  return {state: initialState(mission), frames: [{path: [], index: 0}], activePath: null, decision: null, instructionLimit};
}
function listAt(program, path) { return path.reduce((value, key) => value[key], program); }
function normalize(program, frames) {
  while (frames.length && frames.at(-1).index >= listAt(program, frames.at(-1).path).length) frames.pop();
}
// Um único passo para comandos ou decisões. Frames são copiados: a execução anterior é preservada.
export function stepExecution(mission, program, execution) {
  if (terminal(execution.state)) return execution;
  const frames = execution.frames.map(frame => ({...frame, path: [...frame.path]}));
  normalize(program, frames);
  if (!frames.length) return {...execution, frames, state: {...execution.state, status: 'finished', lastEvent: 'finished', events: []}};
  if (execution.state.instructionPointer >= execution.instructionLimit) return {...execution, frames: [], state: {...execution.state, status: 'limit', lastEvent: 'limit', events: [{type: 'limit'}]}};
  const frame = frames.at(-1), index = frame.index++;
  const activePath = [...frame.path, index], node = listAt(program, frame.path)[index];
  let state, decision = execution.decision;
  if (node.type === 'if') {
    const result = evaluateCondition(mission, execution.state, node.condition), branch = result ? 'then' : 'else';
    decision = {path: activePath, branch, result};
    state = {...execution.state, status: 'running', instructionPointer: execution.state.instructionPointer + 1, lastEvent: 'condition', events: [{type: 'condition', result, branch, condition: structuredClone(node.condition)}]};
    frames.push({path: [...activePath, branch], index: 0});
  } else state = applyCommand(mission, execution.state, node);
  normalize(program, frames);
  if (!frames.length && !terminal(state)) state = {...state, status: 'finished', lastEvent: 'finished'};
  return {...execution, state, frames, activePath, decision};
}
export function simulate(mission, program, options) {
  let execution = createExecution(mission, program, options);
  const states = [execution.state];
  while (!terminal(execution.state)) {
    execution = stepExecution(mission, program, execution);
    states.push(execution.state);
  }
  return states;
}
