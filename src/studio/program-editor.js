import {editProgram} from '../program.js';
import {defaultCondition} from '../condition-options.js';
import {configureCommand} from '../commands.js';
import {createLoop} from '../loops.js';
import {renderProgram} from '../view.js';
import {createExecution} from '../engine.js';
export function changeSolution(mission,operation){return editProgram(mission.solution??[],{...operation,mission});}
export function addSolution(mission,path,kind,id){
 const operation={type:'add',path,mission};
 if(kind==='command')operation.node=configureCommand(mission,id);
 else if(kind==='loop'){operation.nodeType=createLoop(mission,id).type;operation.loopOptionId=id;}
 else if(kind==='switch'){operation.nodeType='switch';operation.switchOptionId=id;}
 else {operation.nodeType=kind;if(kind==='if')operation.condition=defaultCondition(mission);}
 return changeSolution(mission,operation);
}
export function programView(mission,target,execution){return renderProgram(mission.solution??[],{...mission,editorActions:true,editorDecisions:true},execution??createExecution(mission,mission.solution??[]),target,false);}

export function removeSolutionRoot(mission,index){return editProgram(mission.solution??[],{type:'remove',path:[index]});}
