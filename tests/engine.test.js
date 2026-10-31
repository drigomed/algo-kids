import {test} from 'node:test';
import assert from 'node:assert/strict';
import {applyCommand,initialState,simulate,validateMission,directions} from '../src/engine.js';
import {missions} from '../src/missions.js';
const base={grid:{width:5,height:5,obstacles:[]},start:{row:2,col:2,direction:'N'},goal:{row:4,col:4}};
const cmd=type=>({type});
test('avança exatamente uma casa em cada direção',()=>{
 for(const [direction,row,col] of [['N',1,2],['L',2,3],['S',3,2],['O',2,1]]){
 const s=applyCommand(base,{...initialState(base),direction},cmd('move'));assert.equal(s.row,row);assert.equal(s.col,col);}
});
test('rotações preservam posição e completam volta',()=>{
 for(const type of ['turnLeft','turnRight']){let s=initialState(base);for(let i=0;i<4;i++){s=applyCommand(base,s,cmd(type));assert.equal(s.row,2);assert.equal(s.col,2);}assert.equal(s.direction,'N');}
 assert.equal(applyCommand(base,initialState(base),cmd('turnLeft')).direction,'O');
 assert.equal(applyCommand(base,initialState(base),cmd('turnRight')).direction,'L');
});
test('limites em todas as bordas sem deslocamento',()=>{
 for(const [direction,row,col] of [['N',0,2],['L',2,4],['S',4,2],['O',2,0]]){const s=applyCommand(base,{...initialState(base),direction,row,col},cmd('move'));assert.equal(s.status,'collision');assert.equal(s.lastEvent,'boundary');assert.equal(s.row,row);assert.equal(s.col,col);}
});
test('rocha bloqueia e não altera a posição',()=>{const m={...base,grid:{...base.grid,obstacles:[{row:1,col:2}]}};const s=applyCommand(m,initialState(m),cmd('move'));assert.equal(s.status,'collision');assert.equal(s.lastEvent,'obstacle');assert.equal(s.row,2);});
test('vitória exige chegar ao destino e encerra execução',()=>{const m={...base,goal:{row:1,col:2}};const states=simulate(m,[cmd('move'),cmd('move')]);assert.equal(states.at(-1).status,'won');assert.equal(states.at(-1).instructionPointer,1);assert.equal(states.length,2);});
test('programa vazio ou incompleto não vence',()=>{assert.equal(simulate(base,[]).at(-1).status,'finished');assert.equal(simulate(base,[cmd('move')]).at(-1).status,'finished');});
test('mesma entrada produz os mesmos estados e não sofre mutação',()=>{const m=structuredClone(base),p=[cmd('move'),cmd('turnRight')],before=JSON.stringify({m,p});assert.deepEqual(simulate(m,p),simulate(m,p));assert.equal(JSON.stringify({m,p}),before);});
test('rejeita mapas inválidos e comandos desconhecidos',()=>{assert.throws(()=>validateMission({...base,start:{...base.start,row:-1}}));assert.throws(()=>validateMission({...base,grid:{...base.grid,obstacles:[base.start]}}));assert.throws(()=>applyCommand(base,initialState(base),cmd('arbitrary')));});
for(const m of missions)test(`missão ${m.id}: mapa válido e solução alcança estrela`,()=>{assert.equal(validateMission(m),true);const end=simulate(m,m.solution).at(-1);assert.equal(end.status,'won');assert.equal(end.row,m.goal.row);assert.equal(end.col,m.goal.col);});
