import {missions} from './missions.js';
import {createSession, stepSession, canStep, startVariantTests} from './session.js';
import {countNodes, editProgram} from './program.js';
import {renderProgram, renderBoard, encodePath, decodePath, escapeHtml} from './view.js';

const $ = selector => document.querySelector(selector);
let mission = missions[0], program = [], target = [], session = createSession(mission, program);
let timer = null, running = false, editorMessage = '';
const completed = new Set();
const state = () => session.execution.state;
const scenario = () => session.scenarios[session.scenarioIndex];
function stop() { clearTimeout(timer); timer = null; running = false; }
function reset() {
  stop(); session = createSession(mission, program); editorMessage = ''; render();
}
function edit(operation) {
  if (running) return;
  try {
    const next = editProgram(program, operation);
    stop(); program = next; session = createSession(mission, program); target = [];
    editorMessage = ''; render();
  } catch (error) { editorMessage = error.message; render(); }
}
function feedback() {
  const s = state();
  const messages = {
    ready: 'Monte seu caminho e toque em Executar. Você consegue!',
    running: running ? 'Lá vai o robô! Acompanhe cada comando.' : 'Robô pausado. Observe o caminho e continue.',
    won: session.completed ? 'Você conseguiu! Todas as versões desta missão passaram! ✨' : session.scenarioIndex === 0 ? 'Treino concluído! Agora teste o mesmo programa nas outras versões.' : 'Esta versão passou! Vamos observar a próxima.',
    collision: s.lastEvent === 'boundary' ? 'Opa, o tabuleiro acaba aqui! Que tal mudar o caminho?' : 'Uma rocha no caminho! Vamos tentar contornar?',
    finished: 'Os comandos acabaram. Confira a meta e ajuste seu programa para chegar à estrela.',
    limit: 'Foram muitos passos! Vamos simplificar o programa e tentar de novo?'
  };
  if (session.completed && session.scenarios.length === 1) messages.won = 'Você conseguiu! A estrela é sua. Escolha outra missão! ✨';
  const notices = [];
  const collected = s.events.filter(e => e.type === 'collected');
  if (collected.length) notices.push(`Boa descoberta! Você coletou ${collected.length === 1 ? 'um objeto' : `${collected.length} objetos`}.`);
  const condition = s.events.find(e => e.type === 'condition');
  if (condition) notices.push(`A condição é ${condition.result ? 'verdadeira' : 'falsa'}: vamos pelo ramo ${condition.result ? 'ENTÃO' : 'SENÃO'}.`);
  if (s.events.some(e => e.type === 'goalIncomplete')) notices.push('A estrela está aqui, mas falta cumprir a meta. Você pode continuar o caminho!');
  if (!notices.length || s.status !== 'running') notices.push(messages[s.status]);
  return notices.join(' ');
}
function render() {
  const s = state(), current = scenario();
  // Preserve o foco e a rolagem dos componentes que não mudaram neste passo.
  const focus = document.activeElement;
  const focusPath = focus?.dataset.path, focusField = focus?.dataset.field;
  const listScroll = $('#program').scrollTop, missionScroll = $('#missions').scrollLeft;
  $('#missions').innerHTML = missions.map(m => `<button class="mission ${m === mission ? 'selected' : ''} ${completed.has(m.id) ? 'completed' : ''}" data-mission="${m.id}" aria-current="${m === mission ? 'step' : 'false'}"><span>${completed.has(m.id) ? '✓' : String(m.id).padStart(2,'0')}</span><div><small>MISSÃO ${String(m.id).padStart(2,'0')}</small><strong>${escapeHtml(m.title)}</strong></div></button>`).join('');
  $('#missions').scrollLeft = missionScroll;
  $('#mission-number').textContent = `MISSÃO ${String(mission.id).padStart(2,'0')} / ${missions.length}`;
  $('#mission-title').textContent = mission.title;
  $('#lesson-type').textContent = mission.id >= 9 ? 'DECISÕES' : mission.id >= 7 ? 'COLETA' : 'SEQUÊNCIA';
  $('#instructions').textContent = mission.instructions;
  const board = $('#board');
  board.style.setProperty('--columns', current.grid.width);
  board.style.setProperty('--rows', current.grid.height);
  board.style.aspectRatio = `${current.grid.width} / ${current.grid.height}`;
  const remaining = (current.entities ?? []).filter(e => !e.collectible || !s.collectedIds.includes(e.id));
  const location = p => `linha ${p.row + 1}, coluna ${p.col + 1}`;
  board.setAttribute('aria-label', `Tabuleiro ${current.grid.width} por ${current.grid.height}. Robô na ${location(s)}, olhando para ${{N:'norte',L:'leste',S:'sul',O:'oeste'}[s.direction]}. Estrela na ${location(current.goal)}. Obstáculos: ${current.grid.obstacles.map(location).join('; ') || 'nenhum'}. Objetos: ${remaining.map(location).join('; ') || 'nenhum'}.`);
  board.innerHTML = renderBoard(current, s);
  const progress = current.presentation?.progress;
  $('#collection').hidden = !(current.entities?.length || progress);
  $('#collection').textContent = `● Objetos coletados: ${s.collectedCount}${progress ? ` · ${current.presentation.variables[progress.variable]}: ${s.variables[progress.variable]} / ${progress.target}` : ''}`;
  const count = countNodes(program);
  $('#count').textContent = `${count} ${count === 1 ? 'bloco' : 'blocos'}`;
  $('#program').innerHTML = program.length ? renderProgram(program, current, session.execution, target, running) : '<li class="empty"><span>＋</span><strong>Uma aventura começa<br>com uma ideia.</strong><small>Adicione seu primeiro comando acima.</small></li>';
  $('#program').scrollTop = listScroll;
  if (running) {
    const active = $('#program [aria-current="step"]');
    if (active) {
      const item = active.getBoundingClientRect(), viewport = $('#program').getBoundingClientRect();
      if (item.top < viewport.top) $('#program').scrollTop -= viewport.top - item.top + 8;
      else if (item.bottom > viewport.bottom) $('#program').scrollTop += Math.min(item.bottom - viewport.bottom + 8, item.top - viewport.top - 8);
    }
  }
  if (focusField && focusPath !== undefined) document.querySelector(`[data-field="${focusField}"][data-path="${focusPath}"]`)?.focus({preventScroll:true});
  $('#add-if').hidden = mission.id < 9;
  $('#insertion-label').textContent = target.length ? `Adicionar em ${target.at(-1) === 'then' ? 'ENTÃO' : 'SENÃO'} · bloco ${target.filter(p => typeof p === 'number').map(n => n + 1).join(' / ')}` : 'Adicionar no programa principal';
  $('#root-target').setAttribute('aria-pressed', String(!target.length));
  $('#editor-message').textContent = editorMessage;
  $('#feedback').textContent = feedback(); $('#feedback').className = s.status;
  $('#run').disabled = running || !program.length;
  $('#pause').disabled = s.status !== 'running' && !(session.testing && canStep(session));
  $('#pause').textContent = running ? 'Ⅱ Pausar' : '▶ Continuar';
  $('#step').disabled = running || !program.length || !canStep(session);
  document.querySelectorAll('[data-add],#clear,#root-target').forEach(button => button.disabled = running);
  $('#variant-tests').hidden = session.scenarios.length < 2;
  $('#variant-status').textContent = `${session.scenarioIndex === 0 ? 'Treino' : 'Teste'} ${session.scenarioIndex + 1}/${session.scenarios.length}: ${current.variantLabel}. ${session.completed ? 'Todas as versões passaram!' : `${session.passed.length}/${session.scenarios.length} versões concluídas.`}`;
  $('#test-variants').disabled = running || session.scenarioIndex !== 0 || !session.passed.includes(0);
  $('#back-training').disabled = running || session.scenarioIndex === 0;
}
function step() {
  if (!canStep(session)) return;
  session = stepSession(session);
  if (session.completed) completed.add(mission.id);
  if (!canStep(session)) stop();
  render();
}
function tick() { step(); if (running) timer = setTimeout(tick, 700); }
$('#run').onclick = () => { if (!program.length) return; reset(); running = true; tick(); };
$('#pause').onclick = () => { if (running) { stop(); render(); } else if (canStep(session)) { running = true; render(); timer = setTimeout(tick, 450); } };
$('#step').onclick = step;
$('#reset').onclick = $('#back-training').onclick = reset;
$('#test-variants').onclick = () => { session = startVariantTests(session); running = true; render(); timer = setTimeout(tick, 700); };
$('#clear').onclick = () => { if (running) return; program = []; target = []; reset(); };
$('#root-target').onclick = () => { target = []; render(); };
$('.palette').onclick = event => {
  const button = event.target.closest('[data-add]');
  if (!button || button.disabled || button.hidden) return;
  const destination = [...target];
  edit({type:'add', path:destination, nodeType:button.dataset.add});
  // Continue inserindo no ramo selecionado; remoções e reordenação voltam à raiz.
  target = destination; render();
};
$('#program').onclick = event => {
  const button = event.target.closest('button');
  if (!button || button.disabled || running) return;
  if (button.dataset.target !== undefined) {
    target = decodePath(button.dataset.target); render();
    $('.palette').scrollIntoView({block:'nearest', behavior:matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth'});
  } else if (button.dataset.edit) edit({type:button.dataset.edit === 'remove' ? 'remove' : 'move', offset:button.dataset.edit === 'up' ? -1 : 1, path:decodePath(button.dataset.path)});
};
$('#program').onchange = event => {
  const input = event.target;
  if (!input.dataset.field || running) return;
  const block = input.closest('.condition-block');
  const type = block.querySelector(':scope > .condition-choice select').value;
  let condition = {type};
  if (type === 'stateAtLeast') {
    const variable = block.querySelector(':scope > .threshold-fields select')?.value ?? currentProgressVariable();
    const value = Number(block.querySelector(':scope > .threshold-fields input')?.value ?? mission.presentation?.progress?.target ?? 1);
    if (!Number.isInteger(value) || value < 0 || value > 99) { editorMessage = 'Escolha uma quantidade entre 0 e 99.'; render(); return; }
    condition = {type, variable, value};
  }
  edit({type:'condition', path:decodePath(input.dataset.path), condition});
};
function currentProgressVariable() { return mission.presentation?.progress?.variable ?? 'collectedCount'; }
$('#missions').onclick = event => {
  const button = event.target.closest('[data-mission]'); if (!button) return;
  mission = missions.find(m => m.id === Number(button.dataset.mission)); program = []; target = [];
  $('#hint-text').hidden = true; reset();
};
$('#hint').onclick = () => { $('#hint-text').hidden = !$('#hint-text').hidden; $('#hint-text').textContent = mission.hint; };
$('#help').onclick = () => $('#help-dialog').showModal();
$('#close-help').onclick = $('#start').onclick = () => $('#help-dialog').close();
render();
