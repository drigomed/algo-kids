import {assertJsonData} from './data.js';
// Caminhos estruturais compartilhados pelo interpretador e editor, sem DOM.
export const MAX_NODES=300,MAX_DEPTH=8;
const index=value=>Number.isSafeInteger(value)&&value>=0;
export function validatePath(path) {
  assertJsonData(path,'path');
  if(!Array.isArray(path)||path.length>MAX_DEPTH*4+1)throw new Error('Caminho inválido');
  let cursor=0;
  while(cursor<path.length) {
    if(!index(path[cursor++]))throw new Error('Caminho: índice inválido');
    if(cursor===path.length)return path;
    const key=path[cursor++];
    if(key==='cases') {if(!index(path[cursor++])||path[cursor++]!=='body')throw new Error('Caminho: caso inválido');}
    else if(!['then','else','default','body'].includes(key))throw new Error('Caminho: ramo inválido');
  }
  return path;
}
export function encodePath(path) {validatePath(path);return path.join('.');}
export function decodePath(encoded) {
  if(typeof encoded!=='string')throw new Error('Caminho deve ser texto');
  if(encoded==='')return [];
  const path=encoded.split('.').map(token=>/^(0|[1-9]\d*)$/.test(token)?Number(token):token);
  validatePath(path);return path;
}
export function sequenceInfo(program,path) {
  validatePath(path);let list=program,depth=0,cursor=0;const trail=[];
  if(!Array.isArray(list))throw new Error('Programa inválido');
  while(cursor<path.length) {
    const i=path[cursor++],node=list[i],key=path[cursor++];
    if(!index(i)||!node)throw new Error('Bloco não encontrado');
    if(node.type==='if'&&['then','else'].includes(key)) {list=node[key];trail.push({node,index:i,key});}
    else if(['for','while'].includes(node.type)&&key==='body') {list=node.body;trail.push({node,index:i,key});}
    else if(node.type==='switch'&&key==='default') {list=node.default;trail.push({node,index:i,key});}
    else if(node.type==='switch'&&key==='cases') {
      const caseIndex=path[cursor++],body=path[cursor++];
      if(body!=='body'||!index(caseIndex)||!node.cases?.[caseIndex])throw new Error('Caso não encontrado');
      list=node.cases[caseIndex].body;trail.push({node,index:i,key,caseIndex});
    } else throw new Error('Caminho não aponta para uma sequência');
    if(!Array.isArray(list)||++depth>MAX_DEPTH)throw new Error('Ramo inválido ou muito profundo');
  }
  return {list,depth,trail};
}
export function sequenceAt(program,path) {return sequenceInfo(program,path).list;}
export function nodeAt(program,path) {
  validatePath(path);const i=path.at(-1);
  if(!path.length||!index(i))throw new Error('Caminho não aponta para bloco');
  const info=sequenceInfo(program,path.slice(0,-1));
  if(!info.list[i])throw new Error('Bloco não encontrado');
  return {...info,node:info.list[i],index:i};
}
export function branchLists(node) {
  if(node.type==='if')return [node.then,node.else];
  if(['for','while'].includes(node.type))return [node.body];
  if(node.type==='switch') {
    if(!Array.isArray(node.cases)||node.cases.length<2||node.cases.length>8)throw new Error('ESCOLHA: limite de casos');
    return [...node.cases.map(item=>item.body),node.default];
  }
  return [];
}
export function countNodes(program) {
  let total=0;const pending=[{list:program,depth:0}];
  while(pending.length) {
    const {list,depth}=pending.pop();
    if(!Array.isArray(list)||depth>MAX_DEPTH)throw new Error('Programa muito profundo ou ramo inválido');
    for(const node of list) {
      if(!node||++total>MAX_NODES)throw new Error('Seu programa já tem muitos blocos. Tente simplificar o caminho.');
      pending.push(...branchLists(node).map(list=>({list,depth:depth+1})));
    }
  }
  return total;
}
export function rebaseTarget(program,target,operation) {
  let next=[...target];const path=operation.path??[],parent=path.slice(0,-1),i=path.at(-1);
  const prefix=(a,b)=>a.length<=b.length&&a.every((part,index)=>part===b[index]);
  if(operation.type==='switchOption'&&prefix(path,next))next=parent;
  else if(['remove','move'].includes(operation.type)&&prefix(parent,next)&&next.length>parent.length) {
    const slot=parent.length,current=next[slot];
    if(operation.type==='remove') {
      if(current===i)next=parent;else if(current>i)next[slot]--;
    } else if(current===i)next[slot]=i+operation.offset;
    else if(current===i+operation.offset)next[slot]=i;
  }
  try {sequenceAt(program,next);return next;}catch{return [];}
}
