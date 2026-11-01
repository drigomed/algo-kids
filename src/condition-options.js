import {validateCondition, record} from './rules.js';
export const decisionTypes = ['pathClear','stateAtLeast','stateEquals','cellPropertyEquals','memoryEquals','numberCompare'];
const signature = condition => condition.type==='numberCompare'?JSON.stringify([condition.type,condition.operator,condition.left?.kind,condition.left?.name,condition.left?.value,condition.right?.kind,condition.right?.name,condition.right?.value]):JSON.stringify([condition.type,condition.variable,condition.relativeTo,condition.property]);
export function conditionOptions(mission) {
  return mission.conditionOptions ?? [
    {id:'pathClear',label:'Caminho à frente livre?',condition:{type:'pathClear'}},
    {id:'stateAtLeast',label:'Contador atingiu uma quantidade?',condition:{type:'stateAtLeast',variable:mission.presentation?.progress?.variable ?? 'collectedCount',value:mission.presentation?.progress?.target ?? 1}}
  ];
}
export function valuesFor(option) {
  return option.values ?? (typeof option.condition.value === 'boolean' ? [{value:true,label:'Sim'},{value:false,label:'Não'}] : []);
}
export function optionFor(mission, condition) {
  return conditionOptions(mission).find(option => (signature(option.condition) === signature(condition) || (!mission.conditionOptions && option.condition.type === condition.type))&&(!valuesFor(option).length||valuesFor(option).some(value=>value.value===condition.value)));
}
export function validateConditionOptions(mission) {
  if (mission.conditionOptions === undefined) return;
  if (!Array.isArray(mission.conditionOptions) || !mission.conditionOptions.length || mission.conditionOptions.length > 20) throw new Error('Perguntas inválidas');
  const ids = new Set(), signatures = new Map();
  for (const option of mission.conditionOptions) {
    if (!record(option) || typeof option.id !== 'string' || !/^[a-zA-Z][a-zA-Z0-9_-]{0,39}$/.test(option.id) || ids.has(option.id) || typeof option.label !== 'string' || !option.label.trim() || !decisionTypes.includes(option.condition?.type)) throw new Error('Pergunta inválida');
    ids.add(option.id);
    const key = signature(option.condition);
    const domain=valuesFor(option),previous=signatures.get(key)??[];
    if(previous.some(other=>!other.length||!domain.length||other.some(a=>domain.some(b=>a.value===b.value))))throw new Error('Perguntas ambíguas');
    signatures.set(key,[...previous,domain]);
    validateCondition(option.condition, mission.initialVariables ?? {},0,mission.robotMemory??{});
    if (option.values !== undefined && (!Array.isArray(option.values) || !option.values.length || option.values.length > 30)) throw new Error('Opções inválidas');
    if(option.condition.type==='numberCompare'&&option.values!==undefined)throw new Error('numberCompare: configure perguntas completas, sem values');
    const values = valuesFor(option), seen = new Set();
    for (const value of values) {
      if (!record(value) || typeof value.label !== 'string' || typeof value.value !== typeof option.condition.value || seen.has(value.value) || (value.question !== undefined && typeof value.question !== 'string')) throw new Error('Valor de pergunta inválido');
      seen.add(value.value);
      validateCondition({...option.condition,value:value.value}, mission.initialVariables ?? {},0,mission.robotMemory??{});
    }
    if (typeof option.condition.value === 'string' && !values.length) throw new Error('Texto exige opções discretas');
    if (values.length && !values.some(value => value.value === option.condition.value)) throw new Error('Resposta padrão não está nas opções');
  }
}
export function validateDecision(condition, mission) {
  if (!decisionTypes.includes(condition?.type)) throw new Error('Condição não disponível no editor');
  validateCondition(condition, mission.initialVariables ?? {},0,mission.robotMemory??{});
  if(['memoryEquals','numberCompare'].includes(condition.type)&&!mission.conditionOptions)throw new Error('Pergunta de memória não autorizada');
  if (mission.conditionOptions) {
    const option = optionFor(mission,condition);
    if (!option || (valuesFor(option).length && !valuesFor(option).some(value=>value.value===condition.value))) throw new Error('Condição não autorizada nesta missão');
  }
}
export function defaultCondition(mission) { return structuredClone(conditionOptions(mission)[0].condition); }
export function conditionQuestion(mission, condition) {
  const option = optionFor(mission,condition);
  if (!option) return 'A condição foi atendida?';
  const value = valuesFor(option).find(value=>value.value===condition.value);
  if (value?.question) return value.question;
  if (condition.type === 'stateAtLeast') {
    const name = condition.variable === 'collectedCount' ? 'Objetos coletados' : mission.presentation?.variables?.[condition.variable] ?? 'Contador';
    return `${name}: pelo menos ${condition.value}?`;
  }
  return condition.value === undefined || condition.value === option.condition.value ? option.label : `${option.label.replace(/\?$/, '')}: ${value?.label ?? condition.value}?`;
}
export function configureCondition(mission, optionId, fields = {}) {
  const option = conditionOptions(mission).find(option=>option.id===optionId);
  if (!option) throw new Error('Escolha uma pergunta da missão.');
  const condition = structuredClone(option.condition);
  if(condition.type==='numberCompare'&&(fields.variable!==undefined||fields.value!==undefined))throw new Error('Escolha uma comparação autorizada completa.');
  if (fields.variable !== undefined) condition.variable = fields.variable;
  if (fields.value !== undefined) condition.value = fields.value;
  if (condition.type === 'stateAtLeast' && (!Number.isInteger(condition.value) || condition.value < 0 || condition.value > 99)) throw new Error('Escolha uma quantidade entre 0 e 99.');
  validateDecision(condition, mission);
  return condition;
}
