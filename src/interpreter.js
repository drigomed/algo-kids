import {validateLoopNode,loopContext,semanticSignature,MAX_WHILE_HISTORY} from './loops.js';
import {validateSwitchNode,evaluateSwitch,switchBranchPath} from './switches.js';
import {nodeAt,sequenceAt,MAX_NODES,MAX_DEPTH} from './tree.js';
export {MAX_NODES,MAX_DEPTH} from './tree.js';
import {validateDecision} from './condition-options.js';
import {assertJsonData,ExecutionFault,actionFailure} from './data.js';
import {explicitTypes,validateCommand} from './commands.js';
import {initialState, applyCommand, terminal, validateMission} from './world.js';
import {evaluateCondition} from './rules.js';
export const DEFAULT_LIMIT = 1000;
export function validateProgram(program, mission) {
  assertJsonData(program,'program');
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
      } else if(['for','while'].includes(node.type)) {
        validateLoopNode(mission,node);pending.push({list:node.body,depth:depth+1});
      } else if(node.type==='switch') {
        validateSwitchNode(mission,node);
        pending.push(...node.cases.map(item=>({list:item.body,depth:depth+1})),{list:node.default,depth:depth+1});
      } else if(explicitTypes.includes(node.type))validateCommand(node,mission);
      else if (!['move', 'turnLeft', 'turnRight'].includes(node.type)) throw new Error('Instrução não suportada');
    }
  }
  return true;
}
export function createExecution(mission, program, {instructionLimit = DEFAULT_LIMIT} = {}) {
  validateMission(mission); validateProgram(program, mission);
  if (!Number.isInteger(instructionLimit) || instructionLimit < 1 || instructionLimit > 10000) throw new Error('Limite de instruções inválido');
  return {state: initialState(mission), frames: [{path: [], index: 0}], activePath: null, decision: null, instructionLimit};
}
const listAt=sequenceAt;
// Retira listas concluídas, mas para no controlador: o próximo check exige outro passo.
function normalize(program, frames) {
  while(frames.length&&frames.at(-1).kind!=='loop'&&frames.at(-1).index>=listAt(program,frames.at(-1).path).length) {
    const finished=frames.pop(),parent=frames.at(-1);
    if(parent?.kind==='loop'&&JSON.stringify(finished.path)===JSON.stringify([...parent.path,'body']))parent.completed++;
  }
}
function checkLoop(mission,program,execution,frames) {
  const frame=frames.at(-1),activePath=[...frame.path],node=nodeAt(program,activePath).node;
  const context=loopContext(frames);
  let result;
  try {result=node.type==='for'?frame.completed<node.times:evaluateCondition(mission,execution.state,node.condition);}
  catch(error) {
    if(!(error instanceof ExecutionFault))throw error;
    return {...execution,frames:[],activePath,decision:execution.decision,state:actionFailure({...execution.state,instructionPointer:execution.state.instructionPointer+1},error.reason,{action:node.type,loop:context,condition:structuredClone(node.condition),...error.details})};
  }
  if(node.type==='while'&&result) {
    const signature=semanticSignature(execution.state);
    if(frame.history.includes(signature))return {...execution,frames:[],activePath,state:{...execution.state,status:'stalled',reason:'noProgress',lastEvent:'loopStalled',instructionPointer:execution.state.instructionPointer+1,events:[{type:'loopStalled',reason:'noProgress',loop:{...context,completed:frame.completed}}]}};
    frame.history=[...frame.history,signature].slice(-MAX_WHILE_HISTORY);
  }
  const event={type:'loopCheck',...context,result,...(node.type==='while'?{condition:structuredClone(node.condition)}:{})};
  let state={...execution.state,status:'running',instructionPointer:execution.state.instructionPointer+1,lastEvent:'loopCheck',events:[event]};
  if(result)frames.push({path:[...activePath,'body'],index:0});else frames.pop();
  normalize(program,frames);
  if(!frames.length)state={...state,status:'finished',lastEvent:'finished'};
  return {...execution,state,frames,activePath};
}
// Um único passo para comandos ou decisões. Frames são copiados: a execução anterior é preservada.
export function stepExecution(mission, program, execution) {
  if (terminal(execution.state)) return execution;
  const frames = execution.frames.map(frame => ({...frame, path: [...frame.path]}));
  normalize(program, frames);
  if (!frames.length) return {...execution, frames, state: {...execution.state, status: 'finished', lastEvent: 'finished', events: []}};
  if (execution.state.instructionPointer >= execution.instructionLimit) {
    const loop=loopContext(frames);
    return {...execution,frames:[],state:{...execution.state,status:'limit',lastEvent:'limit',events:[{type:'limit',...(loop?{loop,instructionLimit:execution.instructionLimit}:{})}]}};
  }
  if(frames.at(-1).kind==='loop')return checkLoop(mission,program,execution,frames);
  const frame = frames.at(-1), index = frame.index++;
  const activePath = [...frame.path, index], node = listAt(program, frame.path)[index];
  if(['for','while'].includes(node.type)) {
    frames.push({kind:'loop',loopType:node.type,path:activePath,completed:0,...(node.type==='for'?{times:node.times}:{history:[]})});
    return checkLoop(mission,program,execution,frames);
  }
  let state, decision = execution.decision;
  if (node.type === 'if') {
    let result;
    try { result=evaluateCondition(mission,execution.state,node.condition); }
    catch(error) {
      if(!(error instanceof ExecutionFault))throw error;
      return {...execution,frames:[],activePath,decision:null,state:actionFailure({...execution.state,instructionPointer:execution.state.instructionPointer+1},error.reason,{...(loopContext(frames)?{loop:loopContext(frames)}:{}),action:'if',condition:structuredClone(node.condition),...error.details})};
    }
    const branch=result?'then':'else';
    decision = {path: activePath, branch, result};
    state = {...execution.state, status: 'running', instructionPointer: execution.state.instructionPointer + 1, lastEvent: 'condition', events: [{type: 'condition', result, branch, condition: structuredClone(node.condition)}]};
    frames.push({path: [...activePath, branch], index: 0});
  } else if(node.type==='switch') {
    let event;
    try {event=evaluateSwitch(mission,execution.state,node);}
    catch(error) {
      if(!(error instanceof ExecutionFault))throw error;
      return {...execution,frames:[],activePath,decision:null,state:actionFailure({...execution.state,instructionPointer:execution.state.instructionPointer+1},error.reason,{...(loopContext(frames)?{loop:loopContext(frames)}:{}),action:'switch',selector:structuredClone(node.selector),...error.details})};
    }
    decision={path:activePath,selected:event.selected,value:event.value,selector:event.selector};
    state={...execution.state,status:'running',instructionPointer:execution.state.instructionPointer+1,lastEvent:'switch',events:[event]};
    frames.push({path:switchBranchPath(activePath,event.selected),index:0});
  } else state = applyCommand(mission, execution.state, node);
  const loop=loopContext(frames);
  if(loop)state={...state,events:state.events.map(event=>({...event,loop:structuredClone(loop)}))};
  if(!terminal(state)||!frames.some(frame=>frame.kind==='loop'))normalize(program, frames);
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

// Interromper não conta como instrução e preserva todo o estado semântico.
export function interruptExecution(execution) {
  if(execution.state.status!=='running')return execution;
  const loop=loopContext(execution.frames);
  return {...execution,frames:[],state:{...execution.state,status:'stopped',reason:'userStopped',lastEvent:'stopped',events:[{type:'userStopped',path:execution.activePath?[...execution.activePath]:null,...(loop?{loop}:{})}]}};
}
