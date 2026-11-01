import {createLoop,validateLoopNode} from './loops.js';
// Edição imutável das mesmas sequências usadas pela pilha de execução.
import {assertJsonData} from './data.js';
import {validateCommand,explicitTypes} from './commands.js';
import {validateProgram} from './interpreter.js';
import {createSwitch,validateSwitchNode,switchOption,switchHasCommands} from './switches.js';
import {sequenceAt,sequenceInfo,nodeAt,countNodes} from './tree.js';
export {sequenceAt,countNodes,encodePath,decodePath,rebaseTarget} from './tree.js';
export function newNode(type,condition={type:'pathClear'}) {
  if(type==='if')return {type,condition:structuredClone(condition),then:[],else:[]};
  if(!['move','turnLeft','turnRight'].includes(type))throw new Error('Bloco desconhecido ou sem configuração autorizada');
  return {type};
}
export function editProgram(program,operation) {
  assertJsonData(program,'program');countNodes(program);
  if(operation.mission)validateProgram(program,operation.mission);
  const next=structuredClone(program),path=operation.path??[];
  if(operation.type==='add') {
    const {list}=sequenceInfo(next,path);let node;
    if(['for','while'].includes(operation.nodeType)) {
      node=createLoop(operation.mission??{},operation.loopOptionId);
      if(node.type!==operation.nodeType)throw new Error('Tipo de repetição incompatível');
    }
    else if(operation.nodeType==='switch')node=createSwitch(operation.mission??{},operation.switchOptionId);
    else if(operation.node) {
      if(['for','while'].includes(operation.node.type))validateLoopNode(operation.mission??{},operation.node);
      else if(operation.node.type==='switch')validateSwitchNode(operation.mission??{},operation.node);
      else validateCommand(operation.node,operation.mission??{});
      node=structuredClone(operation.node);
    } else node=newNode(operation.nodeType,operation.condition);
    list.push(node);
  } else {
    const {list,index,node}=nodeAt(next,path);
    if(operation.type==='remove')list.splice(index,1);
    else if(operation.type==='move') {
      const target=index+operation.offset;
      if(![-1,1].includes(operation.offset)||target<0||target>=list.length)throw new Error('Posição inválida');
      [list[index],list[target]]=[list[target],list[index]];
    } else if(operation.type==='condition'&&node.type==='if')node.condition=structuredClone(operation.condition);
    else if(operation.type==='command'&&explicitTypes.includes(node.type)&&operation.node?.type===node.type) {
      validateCommand(operation.node,operation.mission??{});list[index]=structuredClone(operation.node);
    } else if(operation.type==='loopOption'&&['for','while'].includes(node.type)) {
      const replacement=createLoop(operation.mission??{},operation.loopOptionId);
      if(replacement.type!==node.type)throw new Error('Para trocar o tipo, remova o bloco e adicione outro.');
      list[index]={...replacement,body:node.body};
    } else if(operation.type==='switchOption'&&node.type==='switch') {
      const replacement=createSwitch(operation.mission??{},operation.switchOptionId);
      if(switchOption(operation.mission??{},node)?.id===operation.switchOptionId)return next;
      const occupied=switchHasCommands(node);
      if(occupied&&operation.confirmDiscard!==true) {
        const error=new Error('Este bloco tem comandos. Trocar a escolha exige confirmar a substituição dos caminhos.');error.code='switchHasCommands';throw error;
      }
      list[index]=replacement;
    } else throw new Error('Edição desconhecida');
  }
  countNodes(next);if(operation.mission)validateProgram(next,operation.mission);
  return next;
}
