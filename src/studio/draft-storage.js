import {assertJsonData} from '../data.js';
import {assertSize} from './io.js';
const KEY='algo-kids-studio-draft-v1';
export function localDraftStorage(getStorage=()=>globalThis.localStorage){
 function access(action){try{return action(getStorage());}catch(error){return {ok:false,message:`Rascunho somente em memória: ${error.message}. Exporte para não perder o trabalho.`};}}
 return {
  save(mission){return access(storage=>{assertJsonData(mission);const text=JSON.stringify({format:'algo-kids-draft',version:1,mission});assertSize(text);storage.setItem(KEY,text);return {ok:true};});},
  load(){return access(storage=>{const text=storage.getItem(KEY);if(!text)return {ok:true,mission:null};assertSize(text);const data=JSON.parse(text);assertJsonData(data);if(data.format!=='algo-kids-draft'||data.version!==1||!data.mission||typeof data.mission!=='object'||Array.isArray(data.mission))throw new Error('Rascunho local incompatível');return {ok:true,mission:data.mission};});},
  clear(){return access(storage=>{storage.removeItem(KEY);return {ok:true};});}
 };
}
