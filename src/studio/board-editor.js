import {renderBoard} from '../view.js';
import {initialState} from '../engine.js';
import {escapeHtml as h} from '../html.js';
export function renderAuthorBoard(mission,activeCell){
 if(mission.grid?.width>12||mission.grid?.height>12)throw new Error('A prévia permite no máximo 12×12');
 const state=initialState(mission);
 return renderBoard(mission,state).replace(/<div class="cell /g,'<button type="button" class="cell ').replace(/<\/div>/g,'</button>').replace(/data-row="(\d+)" data-col="(\d+)"/g,(_,row,col)=>`data-row="${row}" data-col="${col}" aria-label="Linha ${Number(row)+1}, coluna ${Number(col)+1}" aria-pressed="${Number(row)===activeCell.row&&Number(col)===activeCell.col}"`);
}
export function objectsAt(mission,cell){const same=p=>p.row===cell.row&&p.col===cell.col,items=[];for(const key of ['start','goal'])if(same(mission[key]))items.push({path:[key],label:key==='start'?'Robô':'Meta'});for(const key of ['entities','barriers'])for(const [i,item] of (mission[key]??[]).entries())if(same(item))items.push({path:[key,i],label:item.id});for(const [i,item] of mission.grid.obstacles.entries())if(same(item))items.push({path:['grid','obstacles',i],label:'Obstáculo'});for(const [i,item] of (mission.grid.cells??[]).entries())if(same(item))items.push({path:['grid','cells',i],label:'Sensor/propriedades'});return items;}
export function cellInspector(mission,cell){return `<p>Linha ${cell.row+1}, coluna ${cell.col+1}</p>${objectsAt(mission,cell).map(item=>`<button data-object="${h(JSON.stringify(item.path))}">${h(item.label)} · editar / selecionar para mover</button>`).join('')||'<p>Casa vazia.</p>'}`;}
