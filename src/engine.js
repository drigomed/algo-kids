// API pública, compatível com as missões e testes V0.1. Sem DOM.
export {directions, validateMission, initialState, applyCommand, terminal} from './world.js';
export {createExecution, stepExecution, simulate, validateProgram} from './interpreter.js';
export {evaluateCondition} from './rules.js';
