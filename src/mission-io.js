import {assertJsonData,record} from './data.js';
import {diagnose} from './mission-validation.js';
export const MAX_IMPORT_BYTES=1024*1024;
export function assertSize(text){if(typeof text!=='string'||new TextEncoder().encode(text).length>MAX_IMPORT_BYTES)throw new Error('Arquivo excede 1 MiB ou não é texto');}
export function parseMission(text){
 assertSize(text);let value;try{value=JSON.parse(text);}catch{throw new Error('JSON inválido. Selecione um arquivo de missão.');}assertJsonData(value);
 if(record(value)&&Object.hasOwn(value,'format')){
  if(value.format!=='mission-json'||value.version!==1||Object.keys(value).some(key=>!['format','version','mission'].includes(key)))throw new Error('Envelope desconhecido ou ambíguo');value=value.mission;
 }
 const result=diagnose(value);if(!result.valid){const error=new Error(result.errors.map(item=>`${item.path.join('.')||'mission'}: ${item.message}`).join('\n'));error.diagnostics=result;throw error;}
 return structuredClone(value);
}
function stable(value){return Array.isArray(value)?value.map(stable):value&&typeof value==='object'?Object.fromEntries(Object.keys(value).sort().map(key=>[key,stable(value[key])])):value;}
export function serializeMission(mission){const result=diagnose(mission);if(!result.valid)throw new Error('Corrija os erros antes de exportar a missão');const text=JSON.stringify(stable(mission),null,2)+'\n';assertSize(text);return text;}
export function filename(mission){const candidate=[mission.id,mission.title].find(value=>typeof value==='string'||typeof value==='number');return String(candidate??'missao').normalize('NFKD').replace(/[^A-Za-z0-9_-]/g,'-').slice(0,80)||'missao';}
export function downloadMission(mission,document=globalThis.document,url=globalThis.URL,schedule=globalThis.setTimeout){
 if(!url?.createObjectURL)throw new Error('Download indisponível neste navegador; use um navegador com suporte a arquivos locais.');
 const blob=new Blob([serializeMission(mission)],{type:'application/json'}),href=url.createObjectURL(blob),link=document.createElement('a');link.href=href;link.download=filename(mission)+'.json';document.body.append(link);link.click();link.remove();schedule(()=>url.revokeObjectURL(href),1000);
}
export function serializeDraft(mission){assertJsonData(mission);if(!record(mission))throw new Error('Rascunho deve conter um objeto de autoria');const text=JSON.stringify(stable({format:'algo-kids-draft',version:1,mission}),null,2)+'\n';assertSize(text);return text;}
export function parseDraft(text){assertSize(text);let value;try{value=JSON.parse(text);}catch{throw new Error('JSON de rascunho inválido');}assertJsonData(value);if(!record(value)||value.format!=='algo-kids-draft'||value.version!==1||Object.keys(value).length!==3||!Object.hasOwn(value,'mission')||!record(value.mission))throw new Error('Envelope de rascunho inválido: use algo-kids-draft versão 1');return structuredClone(value.mission);}
export function downloadDraft(mission,document=globalThis.document,url=globalThis.URL,schedule=globalThis.setTimeout){
 if(!url?.createObjectURL)throw new Error('Download indisponível neste navegador');const href=url.createObjectURL(new Blob([serializeDraft(mission)],{type:'application/json'})),link=document.createElement('a');link.href=href;link.download=filename(mission)+'.akdraft.json';document.body.append(link);link.click();link.remove();schedule(()=>url.revokeObjectURL(href),1000);
}
