import {resultPresentation} from './visual-resolver.js';
// Controle exclusivamente visual: não agenda passos nem escreve no mundo.
export function createVisualEffects() {
 let previous='';
 return {
  next(mission,state,{context='',completed=false,interrupted=false}={}) {
   const key=JSON.stringify([context,state.instructionPointer,state.status,interrupted,state.events]);
   if(key===previous)return {fresh:false,effects:[],mood:null};previous=key;
   const effects=[],events=state.events??[],result=resultPresentation(state,{completed,interrupted});
   const atRobot={row:state.row,col:state.col};
   const locate=id=>(mission.entities??[]).find(object=>object.id===id)??(mission.barriers??[]).find(object=>object.id===id);
   const position=target=>target?{row:target.row,col:target.col}:atRobot;
   if(result?.fx)effects.push({asset:result.fx,...atRobot});
   for(const event of events) {
    if(interrupted)break;
    if(event.type==='collected')effects.push({asset:'collect-pop',...position(locate(event.entityId))});
    if(event.type==='interacted'&&event.success) {const target=locate(event.entityId);if(target)effects.push({asset:'interact-spark',row:target.row,col:target.col});}
    if(event.type==='barrierChanged') {const target=locate(event.barrierId);if(target)effects.push({asset:'interact-spark',row:target.row,col:target.col});}
    if(event.type==='variableChanged'&&event.previous!==event.value&&event.entityId&&!events.some(other=>other.type==='collected'&&other.entityId===event.entityId)) {const target=locate(event.entityId);if(target)effects.push({asset:'interact-spark',row:target.row,col:target.col});}
    if(event.type==='collision'&&event.reason==='capacityExceeded') {const target=event.target??locate(event.barrierId);if(target)effects.push({asset:'overload-warning',row:target.row,col:target.col});}
   }
   const unique=effects.filter((effect,index)=>effects.findIndex(item=>item.asset===effect.asset&&item.row===effect.row&&item.col===effect.col)===index);
   return {fresh:true,effects:unique,mood:result?.mood??(events.some(e=>e.type==='moved')?'move':events.some(e=>e.type==='turned')?'turn':'idle')};
  }
 };
}
