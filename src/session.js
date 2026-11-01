// Orquestra treino e validação sem depender da interface ou de temporizadores.
import {missionVariants} from './missions.js';
import {createExecution, stepExecution, terminal, validateMission, validateProgram} from './engine.js';
export function createSession(mission, program, options) {
  validateMission(mission);
  const scenarios = missionVariants(mission), snapshot = structuredClone(program);
  scenarios.forEach(scenario=>validateProgram(snapshot,scenario));
  const execution = createExecution(scenarios[0], snapshot, options);
  const passed = execution.state.status === 'won' ? [0] : [];
  return {scenarios, program: snapshot, options, scenarioIndex: 0, passed, testing: false,
    completed: passed.length === scenarios.length, execution};
}
export function canStep(session) {
  return !terminal(session.execution.state) || (session.testing && session.execution.state.status === 'won' && session.scenarioIndex < session.scenarios.length - 1);
}
export function stepSession(session) {
  if (!canStep(session)) return session;
  if (session.execution.state.status === 'won') {
    const scenarioIndex = session.scenarioIndex + 1;
    return {...session, scenarioIndex, execution: createExecution(session.scenarios[scenarioIndex], session.program, session.options)};
  }
  const execution = stepExecution(session.scenarios[session.scenarioIndex], session.program, session.execution);
  const passed = execution.state.status === 'won' ? [...new Set([...session.passed, session.scenarioIndex])] : [...session.passed];
  return {...session, execution, passed, completed: passed.length === session.scenarios.length};
}
export function startVariantTests(session) {
  if (session.scenarioIndex !== 0 || session.execution.state.status !== 'won' || !session.passed.includes(0) || session.scenarios.length < 2) throw new Error('Conclua primeiro o treino com este programa.');
  return {...session, testing: true, scenarioIndex: 1, passed: [0], completed: false,
    execution: createExecution(session.scenarios[1], session.program, session.options)};
}
