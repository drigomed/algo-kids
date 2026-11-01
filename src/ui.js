import {installAssetFallback} from './presentation/asset-registry.js';
import {createVisualEffects} from './presentation/visual-effects.js';
import {renderResultBanner} from './presentation/scene-view.js';
import {stalledMessage,stoppedMessage} from './loops.js';
import {renderLoopPalette,renderLoopTrace} from './loop-view.js';
import {insertionLabel} from './branch-view.js';
import {nodeAt,rebaseTarget} from './tree.js';
import {switchOption,switchHasCommands} from './switches.js';
import {classifyResult} from './engine.js';
import {configureCommand} from './commands.js';
import {renderCommandPalette,renderMemory,failureMessage,commandMessages,renderDecisionTrace,renderSwitchPalette,collisionMessage,passageIndicators,resultLabel} from './command-view.js';
import {conditionOptions, valuesFor, defaultCondition, configureCondition} from './condition-options.js';
import {missions} from './missions.js';
import {createSession, stepSession, canStep, startVariantTests, interruptSession, canInterruptSession} from './session.js';
import {countNodes, editProgram} from './program.js';
import {renderProgram, renderBoard, encodePath, decodePath, escapeHtml, worldIndicators, eventMessages, describeEnvironment} from './view.js';

const $ = selector => document.querySelector(selector);
let mission = missions[0], program = [], target = [], session = createSession(mission, program);
const visualEffects=createVisualEffects();
let visualEpoch=0,lastBoardKey='',lastResultKey='';
installAssetFallback(document);
let playbackGeneration=0;
let timer = null, running = false, editorMessage = '', lastTraceKey='', lastLoopKey='', lastFeedbackKey='';
const completed = new Set();
const state = () => session.execution.state;
const scenario = () => session.scenarios[session.scenarioIndex];
function stopPlayback() { clearTimeout(timer); timer = null; running = false; playbackGeneration++; }
function scheduleTick(delay) {
  const generation=playbackGeneration;
  timer=setTimeout(()=>{if(running&&generation===playbackGeneration)tick();},delay);
}
function reset() {
  stopPlayback(); visualEpoch++; session = createSession(mission, program); editorMessage = ''; render();
}
function edit(operation) {
  if (running) return;
  try {
    const next = editProgram(program, operation);
    const nextSession=createSession(mission,next);
    stopPlayback(); visualEpoch++; program=next; session=nextSession;
    target=rebaseTarget(next,target,operation);
    editorMessage = ''; render();
  } catch (error) { editorMessage = error.message; render(); }
}
function feedback() {
  const s = state();
  if(session.interrupted)return stoppedMessage;
  if(s.status==='stalled')return stalledMessage;
  const messages = {
    stalled: stalledMessage,
    stopped: stoppedMessage,
    ready: 'Monte seu caminho e toque em Executar. Você consegue!',
    running: running ? 'Lá vai o robô! Acompanhe cada comando.' : 'Robô pausado. Observe o caminho e continue.',
    won: session.completed ? 'Você conseguiu! Todas as versões desta missão passaram! ✨' : session.scenarioIndex === 0 ? 'Treino concluído! Agora teste o mesmo programa nas outras versões.' : 'Esta versão passou! Vamos observar a próxima.',
    collision: collisionMessage(scenario(),s),
    finished: 'Os comandos acabaram. Confira a meta e ajuste seu programa para chegar à estrela.',
    actionFailed: failureMessage(scenario(),s),
    limit: s.events.some(event=>event.type==='limit'&&event.loop)?'O robô está repetindo muitas vezes. Veja se algo faz a condição mudar.':'Foram muitos passos! Vamos simplificar o programa e tentar de novo?'
  };
  if (session.completed && session.scenarios.length === 1) messages.won = 'Você conseguiu! A estrela é sua. Escolha outra missão! ✨';
  const notices = [...eventMessages(scenario(),s),...commandMessages(scenario(),s)];
  if (s.events.some(e => e.type === 'goalIncomplete')) notices.push('A estrela está aqui, mas falta cumprir a meta. Você pode continuar o caminho!');
  if (!notices.length || s.status !== 'running') notices.push(messages[s.status]);
  return notices.join(' ');
}
function render() {
  const s = state(), current = scenario();
  // Preserve o foco e a rolagem dos componentes que não mudaram neste passo.
  const focus = document.activeElement;
  const focusPath = focus?.dataset.path, focusField = focus?.dataset.field;
  const focusTarget=focus?.dataset.target, focusOption=focus?.dataset.commandOption, focusSwitch=focus?.dataset.switchOption, focusLoop=focus?.dataset.loopOption;
  const inlineField=['inlineAdd','inlineOption','inlineSwitch','inlineLoop'].find(key=>focus?.dataset[key]!==undefined);
  const listScroll = $('#program').scrollTop, missionScroll = $('#missions').scrollLeft;
  $('#missions').innerHTML = missions.map(m => `<button class="mission ${m === mission ? 'selected' : ''} ${completed.has(m.id) ? 'completed' : ''}" data-mission="${m.id}" aria-current="${m === mission ? 'step' : 'false'}"><span>${completed.has(m.id) ? '✓' : String(m.id).padStart(2,'0')}</span><div><small>MISSÃO ${String(m.id).padStart(2,'0')}</small><strong>${escapeHtml(m.title)}</strong></div></button>`).join('');
  $('#missions').scrollLeft = missionScroll;
  $('#mission-number').textContent = `${mission.demo?'DEMONSTRAÇÃO':'MISSÃO'} ${String(mission.id).padStart(2,'0')} / ${missions.length}`;
  $('#mission-title').textContent = mission.title;
  $('#lesson-type').textContent = mission.demo ? 'CENÁRIO DEMO' : mission.id >= 13 ? 'MUNDO REATIVO' : mission.id >= 9 ? 'DECISÕES' : mission.id >= 7 ? 'COLETA' : 'SEQUÊNCIA';
  $('#instructions').textContent = mission.instructions;
  const board = $('#board');
  board.style.setProperty('--columns', current.grid.width);
  board.style.setProperty('--rows', current.grid.height);
  board.style.aspectRatio = `${current.grid.width} / ${current.grid.height}`;
  const remaining = (current.entities ?? []).filter(e => !s.consumedIds.includes(e.id)&&(!e.collectible || !s.collectedIds.includes(e.id)));
  const location = p => `linha ${p.row + 1}, coluna ${p.col + 1}`;
  board.setAttribute('aria-label', `Tabuleiro ${current.grid.width} por ${current.grid.height}. Robô na ${location(s)}, olhando para ${{N:'norte',L:'leste',S:'sul',O:'oeste'}[s.direction]}. Estrela na ${location(current.goal)}. Obstáculos: ${current.grid.obstacles.map(location).join('; ') || 'nenhum'}. Objetos: ${remaining.map(location).join('; ') || 'nenhum'}. ${describeEnvironment(current,s)}.`);
  const activeNode=session.execution.activePath?.reduce((value,key)=>value?.[key],program);
  const visualContext=`${visualEpoch}:${mission.id}:${session.scenarioIndex}`;
  const visualKey=`${visualContext}:${s.instructionPointer}:${s.status}:${!!session.interrupted}`;
  if(lastBoardKey!==visualKey) {
    const effects=visualEffects.next(current,s,{context:visualContext,completed:session.completed,interrupted:session.interrupted});
    board.innerHTML=renderBoard(current,s,activeNode,{...effects,completed:session.completed,interrupted:session.interrupted});
    board.dataset.visualStatus=session.interrupted?'stopped':s.status;
    lastBoardKey=visualKey;
  }
  const result=renderResultBanner(s,{completed:session.completed,interrupted:session.interrupted});
  if(lastResultKey!==visualKey){$('#visual-result').innerHTML=result;$('#visual-result').hidden=!result;lastResultKey=visualKey;}
  $('#robot-memory').innerHTML=renderMemory(current,s);
  $('#extra-commands').innerHTML=renderCommandPalette(current,running);
  $('#extra-switches').innerHTML=renderSwitchPalette(current,running);
  $('#extra-loops').innerHTML=renderLoopPalette(current,running);
  const loopTrace=renderLoopTrace(current,session.execution,program);
  const loopKey=`${session.scenarioIndex}:${s.instructionPointer}:${loopTrace}`;
  if(lastLoopKey!==loopKey){$('#loop-trace').innerHTML=loopTrace;$('#loop-trace').hidden=!loopTrace;lastLoopKey=loopKey;}
  $('.palette').hidden=target.length>0;
  const trace=renderDecisionTrace(current,s);
  const traceKey=`${session.scenarioIndex}:${s.instructionPointer}:${trace}`;
  if(lastTraceKey!==traceKey){$('#decision-trace').innerHTML=trace;lastTraceKey=traceKey;}
  const progress = current.presentation?.progress;
  $('#collection').hidden = !(current.entities?.some(entity=>entity.collectible) || progress);
  $('#world-state').textContent = worldIndicators(current,s);
  $('#world-state').hidden = !$('#world-state').textContent;
  $('#passage-properties').textContent=passageIndicators(current,s);
  $('#passage-properties').hidden=!$('#passage-properties').textContent;
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
  if(!focusField&&focusTarget!==undefined) {
    const attribute=inlineField?{'inlineAdd':'data-inline-add','inlineOption':'data-inline-option','inlineSwitch':'data-inline-switch','inlineLoop':'data-inline-loop'}[inlineField]:null;
    const selector=attribute?`#program [${attribute}="${focus.dataset[inlineField]}"][data-target="${encodePath(target)}"]`:`#program button[data-target="${encodePath(target)}"]`;
    document.querySelector(selector)?.focus({preventScroll:true});
  } else if(focusOption)document.querySelector(`[data-command-option="${focusOption}"]`)?.focus({preventScroll:true});
  else if(focusLoop)document.querySelector(`[data-loop-option="${focusLoop}"]`)?.focus({preventScroll:true});
  else if(focusSwitch)document.querySelector(`[data-switch-option="${focusSwitch}"]`)?.focus({preventScroll:true});
  else if(focus?.dataset.edit) {
    (document.querySelector(`#program button[data-target="${encodePath(target)}"]`)??$('#root-target')).focus({preventScroll:true});
  }
  $('#add-if').hidden = !(mission.conditionOptions||mission.id>=9);
  $('#insertion-label').textContent = `Adicionar em: ${insertionLabel(mission,program,target)}`;
  $('#root-target').textContent=target.length?'Voltar ao programa principal':'Programa principal';
  $('#root-target').setAttribute('aria-pressed', String(!target.length));
  $('#editor-message').textContent = editorMessage;
  const message=feedback();
  const feedbackKey=`${session.scenarioIndex}:${s.instructionPointer}:${s.status}:${message}`;
  if(lastFeedbackKey!==feedbackKey){$('#feedback').textContent=message;lastFeedbackKey=feedbackKey;}
  const category=session.interrupted?'interrupted':classifyResult(s);
  $('#feedback').className = session.interrupted?'stopped':s.status;
  $('#feedback').dataset.result=category;
  $('#outcome-label').textContent=resultLabel(category);
  $('#run').disabled = running || !program.length;
  $('#stop').hidden=!canInterruptSession(session);
  $('#stop').disabled=!canInterruptSession(session);
  $('#pause').disabled = !canStep(session)||s.status !== 'running' && !(session.testing && canStep(session));
  $('#pause').textContent = running ? 'Ⅱ Pausar' : '▶ Continuar';
  $('#step').disabled = running || !program.length || !canStep(session);
  document.querySelectorAll('[data-add],#clear,#root-target').forEach(button => button.disabled = running);
  $('#variant-tests').hidden = session.scenarios.length < 2;
  $('#variant-status').textContent = `${session.scenarioIndex === 0 ? 'Treino' : 'Teste'} ${session.scenarioIndex + 1}/${session.scenarios.length}: ${current.variantLabel}. ${session.completed ? 'Todas as versões passaram!' : `${session.passed.length}/${session.scenarios.length} versões concluídas.`}`;
  $('#test-variants').disabled = running || session.interrupted || s.status!=='won' || session.scenarioIndex !== 0 || !session.passed.includes(0);
  $('#back-training').disabled = running || session.scenarioIndex === 0;
}
function step() {
  if (!canStep(session)) return;
  session = stepSession(session);
  if (session.completed) completed.add(mission.id);
  if (!canStep(session)) stopPlayback();
  render();
}
function tick() {
  if(!running)return;
  step();
  if(running)scheduleTick(state().events.some(event=>['condition','switch','loopCheck'].includes(event.type))&&!matchMedia('(prefers-reduced-motion: reduce)').matches?1100:700);
}
$('#run').onclick = () => { if (!program.length) return; reset(); running = true; tick(); };
$('#pause').onclick = () => { if (running) { stopPlayback(); render(); } else if (canStep(session)) { running = true; render(); scheduleTick(450); } };
$('#step').onclick = step;
$('#reset').onclick = $('#back-training').onclick = reset;
$('#stop').onclick = () => {stopPlayback();session=interruptSession(session);render();};
$('#test-variants').onclick = () => { stopPlayback();session = startVariantTests(session); running = true; render(); scheduleTick(700); };
$('#clear').onclick = () => { if (running) return; program = []; target = []; reset(); };
$('#root-target').onclick = () => { target = []; render(); };
function addAt(path,nodeType,optionId,switchId,loopId) {
  const destination=[...path];
  try {
    const operation=loopId?{nodeType:mission.loopOptions.find(option=>option.id===loopId)?.kind,loopOptionId:loopId,mission}:switchId?{nodeType:'switch',switchOptionId:switchId,mission}:optionId?{node:configureCommand(mission,optionId),mission}:{nodeType,condition:defaultCondition(mission)};
    edit({type:'add',path:destination,...operation});target=destination;render();
  } catch(error){editorMessage=error.message;render();}
}
$('.palette').onclick=event=>{
  const button=event.target.closest('[data-add],[data-command-option],[data-switch-option],[data-loop-option]');
  if(!button||button.disabled||button.hidden)return;
  addAt(target,button.dataset.add,button.dataset.commandOption,button.dataset.switchOption,button.dataset.loopOption);
};
$('#program').onclick = event => {
  const button = event.target.closest('button');
  if (!button || button.disabled || running) return;
  if(button.dataset.inlineAdd||button.dataset.inlineOption||button.dataset.inlineSwitch||button.dataset.inlineLoop) {
    addAt(decodePath(button.dataset.target),button.dataset.inlineAdd,button.dataset.inlineOption,button.dataset.inlineSwitch,button.dataset.inlineLoop);
  } else if (button.dataset.target !== undefined) {
    target = decodePath(button.dataset.target); render();
    // Os comandos ficam no próprio ramo; não levar a criança de volta ao topo.
  } else if(button.dataset.edit) {
    const path=decodePath(button.dataset.path),node=nodeAt(program,path).node;
    if(button.dataset.edit==='remove'&&['if','switch','for','while'].includes(node.type)&&countNodes([node])>1&&!window.confirm(`Remover este bloco e seus ${countNodes([node])-1} comandos internos?`))return;
    edit({type:button.dataset.edit==='remove'?'remove':'move',offset:button.dataset.edit==='up'?-1:1,path});
  }
};
$('#program').onchange = event => {
  const input = event.target;
  if (!input.dataset.field || running) return;
  if(input.dataset.field==='loop-option') {
    edit({type:'loopOption',path:decodePath(input.dataset.path),loopOptionId:input.value,mission});return;
  }
  if(input.dataset.field==='switch-option') {
    const path=decodePath(input.dataset.path),node=nodeAt(program,path).node;
    if(switchOption(mission,node)?.id===input.value){render();return;}
    const occupied=switchHasCommands(node);
    if(occupied&&!window.confirm(`Trocar esta ESCOLHA substitui todos os caminhos e apaga ${countNodes([node])-1} comandos internos. Quer continuar?`)) {
      editorMessage='Escolha mantida. Nenhum comando foi removido.';render();return;
    }
    edit({type:'switchOption',path,switchOptionId:input.value,mission,confirmDiscard:occupied});return;
  }
  if(input.dataset.field.startsWith('command-')) {
    const block=input.closest('.explicit-command'),optionId=block.querySelector('[data-field="command-option"]').value;
    try {edit({type:'command',path:decodePath(input.dataset.path),mission,node:configureCommand(mission,optionId,input.dataset.field==='command-value'?Number(input.value):undefined)});}
    catch(error){editorMessage=error.message;render();}
    return;
  }
  const block = input.closest('.condition-block');
  const optionId = block.querySelector(':scope > .condition-choice select').value;
  const option = conditionOptions(mission).find(option=>option.id===optionId);
  const fields = {};
  // Ao trocar a pergunta, começar pelos valores declarados pela missão.
  if (input.dataset.field !== 'condition') {
    const variable = block.querySelector(':scope > .threshold-fields select');
    if (variable) fields.variable = variable.value;
    const choice = block.querySelector(':scope > .value-fields select');
    if (choice) fields.value = valuesFor(option)[Number(choice.value)].value;
    const number = block.querySelector(':scope > .threshold-fields input, :scope > .value-fields input');
    if (number) {
      if (number.value.trim()==='' || !Number.isFinite(Number(number.value))) { editorMessage='Escolha uma quantidade válida.'; render(); return; }
      fields.value = Number(number.value);
    }
  }
  try { edit({type:'condition',path:decodePath(input.dataset.path),condition:configureCondition(mission,optionId,fields)}); }
  catch(error) { editorMessage=error.message; render(); }
};
$('#missions').onclick = event => {
  const button = event.target.closest('[data-mission]'); if (!button) return;
  mission = missions.find(m => m.id === Number(button.dataset.mission)); program = []; target = [];
  $('#hint-text').hidden = true; reset();
};
$('#hint').onclick = () => { $('#hint-text').hidden = !$('#hint-text').hidden; $('#hint-text').textContent = mission.hint; };
$('#help').onclick = () => $('#help-dialog').showModal();
$('#close-help').onclick = $('#start').onclick = () => $('#help-dialog').close();
render();
