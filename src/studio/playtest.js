import {canonical} from '../loops.js';
import {createSession,stepSession,interruptSession} from '../session.js';
import {terminal,classifyResult} from '../engine.js';
import {missionVariants} from '../missions.js';
import {diagnose} from './validation.js';
export function createPlaytest(mission,{all=true,scenario=0,instructionLimit=1000}={}){
 const diagnosis=diagnose(mission);if(!diagnosis.valid)throw new Error('Corrija os erros de validação antes do teste');
 if(!mission.solution?.length)throw new Error('Adicione uma solução de referência antes do teste');
 const snapshot=structuredClone(mission),scenarios=missionVariants(snapshot);
 const {variants,...base}=snapshot;
 const chosen=all?scenarios:scenario<0?[{...base,variantId:'base',variantLabel:'Base fora das variantes'}]:[scenarios[scenario]];
 if(chosen.some(value=>!value))throw new Error('Cenário de teste inexistente');
 return {snapshot,scenarios:chosen,sessions:chosen.map(m=>createSession(m,snapshot.solution,{instructionLimit})),index:0,reports:[],trace:[],reachedIds:[],done:false,interrupted:false,all:all||(scenarios.length===1&&(!snapshot.variants||scenario>=0))};
}
export function testState(test){return test.sessions[test.index].execution.state;}
function report(test,session){const s=session.execution.state;const counts=(test.resolvedCounts??[]).filter(c=>c.scenario===test.index).map(({scenario,...c})=>c);return {scenario:test.scenarios[test.index].variantId??String(test.index),label:test.scenarios[test.index].variantLabel??'Cenário',status:s.status,category:classifyResult(s),reason:s.reason??'',row:s.row,col:s.col,direction:s.direction,instructions:s.instructionPointer,...(counts.length?{loopCounts:counts}:{}),...(Object.hasOwn(s,'energyRemaining')?{energyInitial:s.energyInitial,energyRemaining:s.energyRemaining,energySpent:s.energySpent}:{})};}
export function stepPlaytest(test){
 if(test.done)return test;
 const sessions=[...test.sessions],current=sessions[test.index];
 if(terminal(current.execution.state)){
  const reports=[...test.reports,report(test,current)];
  return test.index===sessions.length-1?{...test,reports,done:true}:{...test,reports,index:test.index+1};
 }
 const session=stepSession(current);sessions[test.index]=session;
 const counts=session.execution.state.events.filter(e=>e.type==='loopCheck'&&e.count&&e.completed===0).map(e=>({scenario:test.index,path:[...e.path],count:structuredClone(e.count),times:e.times}));
 return {...test,sessions,...(counts.length?{resolvedCounts:[...(test.resolvedCounts??[]),...counts]}:{}),reachedIds:[...new Set([...test.reachedIds,...session.execution.state.events.map(e=>e.entityId).filter(Boolean)])],trace:[...test.trace,{scenario:test.index,path:session.execution.activePath,instructions:session.execution.state.instructionPointer,events:structuredClone(session.execution.state.events)}]};
}
export function interruptPlaytest(test){
 if(test.done)return test;const sessions=[...test.sessions];sessions[test.index]=interruptSession(sessions[test.index]);
 const current=sessions[test.index],reports=[...test.reports,report(test,current)];
 return {...test,sessions,reports,done:true,interrupted:true};
}
export function referenceValidated(test,mission){return !!test?.done&&!test.interrupted&&test.all&&canonical(test.snapshot)===canonical(mission)&&test.reports.length===test.scenarios.length&&test.reports.every(item=>item.status==='won');}
export function qualityWarnings(test){
 const reached=new Set(test.reachedIds);
 return (test.snapshot.entities??[]).filter(e=>!reached.has(e.id)).map(e=>`Objeto ${e.id}: a solução testada não gerou evento neste objeto. Revise sua necessidade (não é erro fatal).`);
}
