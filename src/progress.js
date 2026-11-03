// Progresso oficial independente de DOM, motor e IDs consecutivos.
import {assertJsonData,record} from './data.js';
export const PROGRESS_KEY='algo-kids-progress/v1';
export function normalizeProgress(catalog,values=[]){const supplied=new Set(Array.isArray(values)?values:[]),completed=new Set();for(const mission of catalog){if(!supplied.has(mission.id))break;completed.add(mission.id);}return completed;}
export function isUnlocked(catalog,completed,id){const index=catalog.findIndex(m=>m.id===id);return index>=0&&catalog.slice(0,index).every(m=>completed.has(m.id));}
export function currentMission(catalog,completed){return catalog.find(m=>!completed.has(m.id))??catalog.at(-1);}
export function serializeProgress(catalog,completed){return JSON.stringify({format:PROGRESS_KEY,completedMissionIds:[...normalizeProgress(catalog,[...completed])]});}
export function parseProgress(catalog,text){
 if(typeof text!=='string'||text.length>32768)throw new Error('Progresso inválido');const data=JSON.parse(text);assertJsonData(data);
 if(!record(data)||Object.keys(data).length!==2||data.format!==PROGRESS_KEY||!Array.isArray(data.completedMissionIds)||data.completedMissionIds.length>1000)throw new Error('Formato de progresso inválido');
 return normalizeProgress(catalog,data.completedMissionIds);
}
export function createProgressStore(catalog,getStorage){return {
 load(){try{const text=getStorage().getItem(PROGRESS_KEY);return {completed:text===null?new Set():parseProgress(catalog,text),message:''};}catch{return {completed:new Set(),message:'Não foi possível carregar o progresso local. Você pode jogar; conquistas anteriores desta sessão não foram recuperadas.'};}},
 save(completed){try{getStorage().setItem(PROGRESS_KEY,serializeProgress(catalog,completed));return {ok:true,message:''};}catch{return {ok:false,message:'Progresso mantido nesta sessão. O navegador não permitiu salvar; ao fechar ou recarregar, ele poderá ser perdido.'};}}
};}
// Acesso de exploração não representa conquista e não altera o registro salvo.
export function explorationEnabled(search=''){return new URLSearchParams(search).get('unlockAll')==='1';}
