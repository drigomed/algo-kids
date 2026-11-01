// Operações da árvore do editor; também utilizáveis sem DOM.
import {MAX_DEPTH, MAX_NODES} from './interpreter.js';
export function sequenceAt(program, path) {
  const sequence = path.reduce((value, key) => value?.[key], program);
  if (!Array.isArray(sequence)) throw new Error('Ramo inválido');
  return sequence;
}
export function countNodes(program) {
  return program.reduce((total, node) => total + 1 + (node.type === 'if' ? countNodes(node.then) + countNodes(node.else) : 0), 0);
}
export function newNode(type, condition = {type:'pathClear'}) {
  if (type === 'if') return {type, condition: structuredClone(condition), then: [], else: []};
  if (!['move', 'turnLeft', 'turnRight'].includes(type)) throw new Error('Bloco desconhecido');
  return {type};
}
export function editProgram(program, operation) {
  const next = structuredClone(program);
  const path = operation.path ?? [];
  if (operation.type === 'add') {
    if (countNodes(program) >= MAX_NODES || (operation.nodeType === 'if' && path.length / 2 >= MAX_DEPTH)) throw new Error('Seu programa já tem muitos blocos. Tente simplificar o caminho.');
    sequenceAt(next, path).push(newNode(operation.nodeType, operation.condition));
  } else {
    const list = sequenceAt(next, path.slice(0, -1)), index = path.at(-1);
    if (!Number.isInteger(index) || !list[index]) throw new Error('Bloco não encontrado');
    if (operation.type === 'remove') list.splice(index, 1);
    else if (operation.type === 'move') {
      const target = index + operation.offset;
      if (![-1, 1].includes(operation.offset) || target < 0 || target >= list.length) throw new Error('Posição inválida');
      [list[index], list[target]] = [list[target], list[index]];
    } else if (operation.type === 'condition' && list[index].type === 'if') list[index].condition = structuredClone(operation.condition);
    else throw new Error('Edição desconhecida');
  }
  return next;
}
