import {missions} from './missions.js';
import {initialState,applyCommand} from './engine.js';
const $ = s=>document.querySelector(s);
const labels={move:'Avançar',turnLeft:'Virar à esquerda',turnRight:'Virar à direita'};
const icons={move:'↑',turnLeft:'↶',turnRight:'↷'};
let mission=missions[0], program=[], state=initialState(mission), timer=null, running=false, active=-1;
const completed=new Set();
function stop(){clearTimeout(timer);timer=null;running=false;}
function reset(){stop();state=initialState(mission);active=-1;render();}
function editable(){return state.status==='ready';}
function edit(fn){if(running)return; reset();fn();render();}
function render(){
 $('#missions').innerHTML=missions.map(m=>`<button class="mission ${m===mission?'selected':''} ${completed.has(m.id)?'completed':''}" data-mission="${m.id}" aria-current="${m===mission?'step':'false'}"><span>${completed.has(m.id)?'✓':String(m.id).padStart(2,'0')}</span><div><small>MISSÃO ${String(m.id).padStart(2,'0')}</small><strong>${m.title}</strong></div></button>`).join('');
 $('#mission-number').textContent=`MISSÃO ${String(mission.id).padStart(2,'0')} / 06`;
 $('#mission-title').textContent=mission.title;$('#instructions').textContent=mission.instructions;
 $('#board').setAttribute('aria-label',`Tabuleiro 5 por 5. Robô na linha ${state.row+1}, coluna ${state.col+1}, olhando para ${{N:'norte',L:'leste',S:'sul',O:'oeste'}[state.direction]}. Estrela na linha ${mission.goal.row+1}, coluna ${mission.goal.col+1}.`);
 $('#board').innerHTML=Array.from({length:25},(_,i)=>{const row=Math.floor(i/5),col=i%5;const robot=state.row===row&&state.col===col, goal=mission.goal.row===row&&mission.goal.col===col, rock=mission.grid.obstacles.some(o=>o.row===row&&o.col===col);return `<div class="cell ${(row+col)%2?'alternate':''} ${goal?'goal':''}">${goal?'<span class="star">★</span>':''}${rock?'<span class="rock">◆</span>':''}${robot?`<div class="robot" style="--angle:${{N:0,L:90,S:180,O:270}[state.direction]}deg"><span class="robot-arrow">▲</span><span class="robot-head"><i></i><i></i></span><span class="robot-body"></span></div>`:''}</div>`}).join('');
 $('#count').textContent=`${program.length} ${program.length===1?'passo':'passos'}`;
 $('#program').innerHTML=program.length?program.map((c,i)=>`<li class="command ${c.type} ${i===active?'active':''}" ${i===active?'aria-current="step"':''}><span class="command-number">${i+1}</span><b>${icons[c.type]}</b><span>${labels[c.type]}</span><div class="row-controls"><button data-up="${i}" aria-label="Mover comando ${i+1} para cima" ${running||i===0?'disabled':''}>↑</button><button data-down="${i}" aria-label="Mover comando ${i+1} para baixo" ${running||i===program.length-1?'disabled':''}>↓</button><button data-remove="${i}" aria-label="Remover comando ${i+1}" ${running?'disabled':''}>×</button></div></li>`).join(''):'<li class="empty"><span>＋</span><strong>Uma aventura começa<br>com uma ideia.</strong><small>Adicione seu primeiro comando acima.</small><div>↑ &nbsp; ↶ &nbsp; ↷</div></li>';
 const messages={ready:'Monte seu caminho e toque em Executar. Você consegue!',running:running?'Lá vai o robô! Acompanhe cada comando.':'Robô pausado. Observe o caminho e continue.',won:'Você conseguiu! A estrela é sua. Escolha outra missão! ✨',collision:state.lastEvent==='boundary'?'Opa, o tabuleiro acaba aqui! Que tal mudar o caminho?':'Uma rocha no caminho! Vamos tentar contornar?',finished:'Os comandos acabaram. A estrela está esperando! Ajuste seu programa.'};
 $('#feedback').textContent=messages[state.status];$('#feedback').className=state.status;
 $('#run').disabled=running||!program.length;$('#pause').disabled=editable()||['won','collision','finished'].includes(state.status);$('#pause').textContent=running?'Ⅱ Pausar':'▶ Continuar';$('#step').disabled=running||!program.length||['won','collision','finished'].includes(state.status);
 document.querySelectorAll('[data-add],#clear').forEach(b=>b.disabled=running);
}
function step(){
 if(['won','collision','finished'].includes(state.status))return;
 if(state.instructionPointer>=program.length){state={...state,status:'finished'};stop();render();return;}
 active=state.instructionPointer;state=applyCommand(mission,state,program[active]);
 if(state.status==='won'){completed.add(mission.id);stop();}
 else if(state.status==='collision')stop();
 else if(state.instructionPointer===program.length){state={...state,status:'finished'};stop();}
 render();
}
function tick(){step();if(running)timer=setTimeout(tick,700);}
$('#run').onclick=()=>{if(!program.length)return;reset();running=true;tick();};
$('#pause').onclick=()=>{if(running){stop();render();}else{running=true;render();timer=setTimeout(tick,450);}};
$('#step').onclick=step;$('#reset').onclick=reset;
$('#clear').onclick=()=>edit(()=>program=[]);
$('.palette').onclick=e=>{const b=e.target.closest('[data-add]');if(b&&!b.disabled)edit(()=>program.push({type:b.dataset.add}));};
$('#program').onclick=e=>{const b=e.target.closest('button');if(!b||b.disabled)return;edit(()=>{if(b.dataset.remove!==undefined)program.splice(+b.dataset.remove,1);else{const i=+(b.dataset.up??b.dataset.down),j=i+(b.dataset.up!==undefined?-1:1);[program[i],program[j]]=[program[j],program[i]];}});};
$('#missions').onclick=e=>{const b=e.target.closest('[data-mission]');if(!b)return;mission=missions.find(m=>m.id===+b.dataset.mission);program=[];$('#hint-text').hidden=true;reset();};
$('#hint').onclick=()=>{$('#hint-text').hidden=!$('#hint-text').hidden;$('#hint-text').textContent=mission.hint;};
$('#help').onclick=()=>$('#help-dialog').showModal();$('#close-help').onclick=$('#start').onclick=()=>$('#help-dialog').close();
render();
