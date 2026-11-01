import {assertJsonData,record,validVariable} from './data.js';
import {validateCondition} from './rules.js';
export const MAX_LOOP_OPTIONS=20,MAX_TIMES=20;
// Ordem de propriedades não altera a autorização; a ordem dos arrays é significativa.
export function canonical(value) {
  if(Array.isArray(value))return `[${value.map(canonical).join(',')}]`;
  if(value&&typeof value==='object')return `{${Object.keys(value).sort().map(key=>`${JSON.stringify(key)}:${canonical(value[key])}`).join(',')}}`;
  return JSON.stringify(value);
}
function fields(value,allowed) {
  if(!record(value)||Object.keys(value).some(key=>!allowed.includes(key)))throw new Error('Repetição: campos inválidos');
}
const signature=value=>value.kind==='for'||value.type==='for'?`for:${value.times}`:`while:${canonical(value.condition)}`;
export function validateLoopOptions(mission) {
  if(!Object.hasOwn(mission,'loopOptions'))return;
  assertJsonData(mission,'mission');
  if(!Array.isArray(mission.loopOptions)||mission.loopOptions.length>MAX_LOOP_OPTIONS)throw new Error('loopOptions: limite de 20 opções');
  const ids=new Set(),presets=new Set();
  for(const option of mission.loopOptions) {
    fields(option,option?.kind==='for'?['id','label','kind','times']:['id','label','kind','condition']);
    if(!validVariable(option.id)||ids.has(option.id)||typeof option.label!=='string'||!option.label.trim())throw new Error('loopOptions: ID ou rótulo inválido');
    ids.add(option.id);
    if(option.kind==='for') {
      if(!Number.isSafeInteger(option.times)||option.times<1||option.times>MAX_TIMES)throw new Error('REPITA: escolha de 1 a 20 vezes');
    } else if(option.kind==='while')validateCondition(option.condition,mission.initialVariables??{},0,mission.robotMemory??{});
    else throw new Error('loopOptions: tipo inválido');
    const key=signature(option);
    if(presets.has(key))throw new Error('loopOptions: repetição duplicada');
    presets.add(key);
  }
}
export function loopOption(mission,node) {return (mission.loopOptions??[]).find(option=>option.kind===node.type&&signature(option)===signature(node));}
export function validateLoopNode(mission,node) {
  assertJsonData(node,'loop');
  fields(node,node?.type==='for'?['type','times','body']:['type','condition','body']);
  validateLoopOptions(mission);
  if(node.type==='for'&&(!Number.isSafeInteger(node.times)||node.times<1||node.times>MAX_TIMES))throw new Error('REPITA: quantidade inválida');
  if(!['for','while'].includes(node.type)||!Array.isArray(node.body)||!loopOption(mission,node))throw new Error('Repetição não autorizada ou corpo inválido');
}
export function createLoop(mission,id) {
  assertJsonData(mission,'mission');
  validateLoopOptions(mission);
  const option=(mission.loopOptions??[]).find(option=>option.id===id);
  if(!option)throw new Error('Escolha uma repetição autorizada pela missão.');
  return option.kind==='for'?{type:'for',times:option.times,body:[]}:{type:'while',condition:structuredClone(option.condition),body:[]};
}
export function loopPermissions(mission) {return canonical((mission.loopOptions??[]).map(option=>[option.id,signature(option)]).sort((a,b)=>a[0].localeCompare(b[0])));}
// Também usado pela interface: nenhum contador é gravado na AST ou no mundo.
export function loopContext(frames) {
  const frame=frames.findLast(frame=>frame.kind==='loop');
  return frame?{loopType:frame.loopType,path:[...frame.path],iteration:frame.completed+1,...(frame.loopType==='for'?{times:frame.times,completed:frame.completed}:{})}:null;
}

export const MAX_WHILE_HISTORY=256;
// Apenas dados que influenciam passos futuros; metadados de execução não entram.
export function semanticSignature(state) {
  return canonical({robot:{row:state.row,col:state.col,direction:state.direction},variables:state.variables,memory:state.memory,collectedCount:state.collectedCount,collectedIds:state.collectedIds,consumedIds:state.consumedIds,usedInteractions:state.usedInteractions,...(Object.hasOwn(state,'energyRemaining')?{energyRemaining:state.energyRemaining,energySpent:state.energySpent}:{})});
}
export const stalledMessage='O robô ficou preso repetindo! Ele voltou à mesma situação e a condição continua verdadeira. Experimente mudar alguma coisa dentro do ENQUANTO para conseguir sair.';
export const stoppedMessage='Você interrompeu o robô. Seu programa continua aqui. Toque em Executar para tentar de novo.';
