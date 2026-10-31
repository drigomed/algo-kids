export const directions = ['N', 'L', 'S', 'O'];
const vectors = [[-1,0],[0,1],[1,0],[0,-1]];
export function validateMission(m) {
  const inside = p => Number.isInteger(p.row) && Number.isInteger(p.col) && p.row >= 0 && p.col >= 0 && p.row < m.grid.height && p.col < m.grid.width;
  if (!Number.isInteger(m.grid.width) || !Number.isInteger(m.grid.height) || m.grid.width < 1 || m.grid.height < 1 || !inside(m.start) || !inside(m.goal) || !directions.includes(m.start.direction)) throw new Error('Missão inválida');
  const keys = new Set();
  for (const o of m.grid.obstacles) { const key = `${o.row},${o.col}`; if (!inside(o) || keys.has(key) || [m.start,m.goal].some(p => p.row === o.row && p.col === o.col)) throw new Error('Obstáculo inválido'); keys.add(key); }
  return true;
}
export function initialState(m) { return {...m.start, status: m.start.row === m.goal.row && m.start.col === m.goal.col ? 'won' : 'ready', instructionPointer: 0, lastEvent: 'ready'}; }
export function applyCommand(m, state, command) {
  if (['won','collision','finished'].includes(state.status)) return {...state};
  const next = {...state, status: 'running', instructionPointer: state.instructionPointer + 1};
  const i = directions.indexOf(state.direction);
  if (command.type === 'turnLeft' || command.type === 'turnRight') { next.direction = directions[(i + (command.type === 'turnLeft' ? 3 : 1)) % 4]; next.lastEvent = command.type; }
  else if (command.type === 'move') {
    const [dr,dc] = vectors[i]; const row = state.row + dr, col = state.col + dc;
    if (row < 0 || col < 0 || row >= m.grid.height || col >= m.grid.width) return {...next,status:'collision',lastEvent:'boundary'};
    if (m.grid.obstacles.some(o=>o.row===row && o.col===col)) return {...next,status:'collision',lastEvent:'obstacle'};
    Object.assign(next,{row,col,lastEvent:'move'});
  } else throw new Error('Comando desconhecido');
  if (next.row === m.goal.row && next.col === m.goal.col) Object.assign(next,{status:'won',lastEvent:'won'});
  return next;
}
export function simulate(m, program) {
  validateMission(m); const states = [initialState(m)];
  for (const command of program) { if (['won','collision'].includes(states.at(-1).status)) break; states.push(applyCommand(m,states.at(-1),command)); }
  const last = states.at(-1); if (!['won','collision'].includes(last.status)) states.push({...last,status:'finished',lastEvent:'finished'});
  return states;
}
