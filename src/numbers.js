import {record,validVariable,ExecutionFault} from './data.js';
import {readMemory} from './memory.js';
import {propertyType,objectProperties} from './properties.js';
export const numberOperators=['eq','ne','gt','gte','lt','lte'];
function validateOperand(operand,variables,memory,context) {
  if(!record(operand)||Object.keys(operand).some(key=>!['kind',operand.kind==='literal'?'value':'name'].includes(key)))throw new Error('numberCompare: operando inválido');
  if(operand.kind==='literal') {if(!Number.isFinite(operand.value))throw new Error('numberCompare: literal deve ser número finito');return;}
  if(!validVariable(operand.name)&&!(operand.kind==='worldVariable'&&operand.name==='collectedCount'))throw new Error('numberCompare: nome inválido');
  if(operand.kind==='worldVariable') {if(operand.name!=='collectedCount'&&(!Object.hasOwn(variables,operand.name)||typeof variables[operand.name]!=='number'))throw new Error('numberCompare: variável numérica não declarada');}
  else if(operand.kind==='memoryVariable') {if(context.physical||!Object.hasOwn(memory,operand.name)||memory[operand.name].type!=='number')throw new Error('numberCompare: memória numérica inválida ou proibida na física');}
  else if(operand.kind==='barrierProperty') {if(!context.barrier||propertyType(context.barrier.properties,operand.name,variables)!=='number')throw new Error('numberCompare: propriedade numérica fora do contexto da barreira');}
  else throw new Error('numberCompare: fonte desconhecida');
}
export function validateNumberCompare(condition,variables,memory={},context={}) {
  if(!numberOperators.includes(condition.operator))throw new Error('numberCompare: operador inválido');
  validateOperand(condition.left,variables,memory,context);validateOperand(condition.right,variables,memory,context);
}
function operandValue(mission,state,operand,context) {
  let value;
  if(operand.kind==='literal')value=operand.value;
  else if(operand.kind==='worldVariable')value=operand.name==='collectedCount'?state.collectedCount:state.variables[operand.name];
  else if(operand.kind==='memoryVariable') {if(context.physical)throw new ExecutionFault('typeMismatch');value=readMemory(state,operand.name);}
  else if(operand.kind==='barrierProperty')value=objectProperties(context.barrier,state)[operand.name];
  if(typeof value!=='number'||!Number.isFinite(value))throw new ExecutionFault('typeMismatch');
  return value;
}
export function comparisonValues(mission,state,condition,context={}) {
  return {actual:operandValue(mission,state,condition.left,context),limit:operandValue(mission,state,condition.right,context),operator:condition.operator};
}
export function evaluateNumberCompare(mission,state,condition,context={}) {
  const {actual:a,limit:b}=comparisonValues(mission,state,condition,context);
  return {eq:()=>a===b,ne:()=>a!==b,gt:()=>a>b,gte:()=>a>=b,lt:()=>a<b,lte:()=>a<=b}[condition.operator]();
}
