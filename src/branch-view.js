import {escapeHtml as h} from './html.js';
import {encodePath,countNodes,sequenceInfo} from './tree.js';
import {renderInlinePalette} from './command-view.js';
import {switchOption} from './switches.js';
export function renderBranch({mission,list,path,label,target,chosen=false,deciding=false,disabled,kind='',render}) {
  const selected=JSON.stringify(path)===JSON.stringify(target),key=encodePath(path),count=countNodes(list);
  return `<section class="branch ${kind} ${chosen?'executing-branch':''} ${selected?'insertion-branch':''}" data-branch-path="${key}"><div class="branch-heading"><strong>${h(label)}</strong><span class="branch-count">${count} ${count===1?'bloco':'blocos'}</span>${deciding?`<span class="branch-state">${chosen?'Caminho escolhido':'Não escolhido'}</span>`:''}</div><ol class="branch-list">${list.length?render(list,path):'<li class="branch-empty">Sem comandos neste caminho.</li>'}</ol><button class="select-branch" data-target="${key}" ${disabled?'disabled':''} aria-pressed="${selected}">${selected?'✓ Adicionar aqui · selecionado':'+ Adicionar aqui'}</button>${selected&&!disabled?`<p class="local-destination">Destino: ${h(label)} · adicionar no fim deste caminho</p>${renderInlinePalette(mission,key)}`:''}</section>`;
}
export function insertionLabel(mission,program,path) {
  const {trail}=sequenceInfo(program,path);
  return ['Programa principal',...trail.map(step=>step.node.type==='if'?`Bloco ${step.index+1}: ${step.key==='then'?'ENTÃO':'SENÃO'}`:`Bloco ${step.index+1}: ${step.key==='default'?switchOption(mission,step.node)?.defaultLabel??'OUTRO VALOR':switchOption(mission,step.node)?.cases[step.caseIndex]?.label??`Caso ${step.caseIndex+1}`}`)].join(' → ');
}
