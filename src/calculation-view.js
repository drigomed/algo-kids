import {escapeHtml as h} from './html.js';
import {commandMessages,failureMessage,collisionMessage} from './command-view.js';
import {eventMessages} from './view.js';

const valueLabel=value=>typeof value==='boolean'?(value?'Sim':'Não'):String(value);
function variableLabel(mission,name){
 return mission.presentation?.variables?.[name]
  ??mission.presentation?.stateIndicators?.find(item=>item.variable===name)?.label
  ??name;
}
export function calculationRows(mission,history){
 return history.map(record=>{
  const messages=[...eventMessages(mission,record),...commandMessages(mission,record)];
  for(const event of record.events){
   if(event.type==='moved')messages.push(`Avançou para linha ${event.row+1}, coluna ${event.col+1}.`);
   if(event.type==='turned')messages.push(`Virou para ${{N:'norte',L:'leste',S:'sul',O:'oeste'}[event.direction]}.`);
   if(event.type==='variableChanged')messages.push(`${variableLabel(mission,event.variable)}: ${valueLabel(event.previous)} → ${valueLabel(event.value)}.`);
   if(event.type==='effectCondition')messages.push(`Condição do objeto: ${event.result?'Sim':'Não'}.`);
   if(event.type==='energyConsumed')messages.push(`Energia consumida: ${event.cost}; restante: ${event.remaining}.`);
   if(event.type==='actionFailed')messages.push(failureMessage(mission,{...record,reason:event.reason}));
   if(event.type==='collision')messages.push(collisionMessage(mission,{...record,reason:event.reason}));
   if(event.type==='energyDepleted')messages.push(failureMessage(mission,{...record,status:'energyDepleted'}));
   if(event.type==='goalIncomplete')messages.push('Chegou ao destino; ainda falta cumprir a meta.');
   if(event.type==='goalReached')messages.push('Meta alcançada; conferindo o encerramento das repetições.');
   if(event.type==='won')messages.push('Programa encerrado com a meta cumprida.');
   if(event.type==='limit')messages.push('Limite de instruções alcançado.');
  }
  if(!messages.length&&record.status==='finished')messages.push('Programa encerrado sem completar a meta.');
  return `<li><strong>Passo ${record.instruction}</strong> · ${[...new Set(messages)].map(h).join(' ')||'Passo concluído.'}</li>`;
 }).join('');
}
export function calculationLog(session){
 return [...(session.executionArchives??[]),{scenarioIndex:session.scenarioIndex,execution:session.execution}]
  .map(part=>`<section><h4>Execução ${part.scenarioIndex+1}</h4><ol>${calculationRows(session.scenarios[part.scenarioIndex],part.execution.calculationHistory??[])}</ol></section>`).join('');
}
export function playtestLogSession(test){
 return {scenarios:test.scenarios,scenarioIndex:test.index,execution:test.sessions[test.index].execution,
  executionArchives:test.sessions.slice(0,test.index).map((session,scenarioIndex)=>({scenarioIndex,execution:session.execution}))};
}
export function calculationCount(session){
 return [...(session.executionArchives??[]),{execution:session.execution}]
  .reduce((count,part)=>count+(part.execution.calculationHistory?.length??0),0);
}
