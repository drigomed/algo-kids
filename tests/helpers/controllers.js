import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {runInThisContext} from 'node:vm';
import {mountStudio} from '../../src/studio/app.js';
import {serializeMission,serializeDraft} from '../../src/mission-io.js';
export function studioController(){
 const elements=new Map(),listeners=new Map(),timers=new Map();let next=0,allow=true,exportedDraft=null;const confirmations=[];
 const document={activeElement:null,querySelector:element,querySelectorAll:()=>[],addEventListener(type,fn){const f=listeners.get(type)??[];f.push(fn);listeners.set(type,f);}};
 function element(selector){if(!elements.has(selector))elements.set(selector,{dataset:{},_value:'',get value(){return this._value;},set value(v){this._value=String(v??'');},checked:false,innerHTML:'',textContent:'',hidden:false,disabled:false,style:{setProperty(){}},setAttribute(){},querySelector(){return null;},focus(){document.activeElement=this;}});return elements.get(selector);}
 const storage={save:()=>({ok:false,message:'Somente em memória'}),load:()=>({ok:true,mission:null}),clear:()=>({ok:true})};
 const app=mountStudio(document,{storage,confirm:message=>{confirmations.push(message);return allow;},downloadDraft:m=>exportedDraft=serializeDraft(m),setTimeout:fn=>{timers.set(++next,fn);return next;},clearTimeout:id=>timers.delete(id)});
 function fire(type,dataset,value){const node={dataset,value,disabled:false,closest(selector){if(selector==='button'||selector==='#program')return this;return null;}};document.activeElement=node;for(const fn of listeners.get(type)??[])fn({target:node});}
 return {app,element,timers,confirmations,allow:value=>allow=value,exportedDraft:()=>exportedDraft,click:d=>fire('click',d),change:(d,v)=>fire('change',d,v),deleteRendered(path){const html=element('#program').innerHTML;const match=[...html.matchAll(/<button\b([^>]*data-edit="remove"[^>]*)>([\s\S]*?)<\/button>/g)].find(m=>m[1].includes(`data-path="${path}"`));assert(match,`controle renderizado não encontrado ${path}`);assert.match(match[2],/Excluir/);const dataset=Object.fromEntries([...match[1].matchAll(/data-([a-z-]+)="([^"]*)"/g)].map(([,key,value])=>[key.replace(/-([a-z])/g,(_,x)=>x.toUpperCase()),value]));fire('click',dataset);},next(){const [id,fn]=timers.entries().next().value??[];if(fn){timers.delete(id);fn();}}};
}
export async function gameController(){
 const source=await readFile(new URL('../../src/ui.js',import.meta.url),'utf8'),bindings={};for(const match of source.matchAll(/^import \{([^}]+)\} from '([^']+)';$/gm)){const module=await import(new URL(match[2],new URL('../../src/ui.js',import.meta.url)));for(const name of match[1].split(',').map(s=>s.trim()))bindings[name]=module[name];}
 const elements=new Map(),timers=new Map();let next=0;function element(selector){if(selector.includes(' '))return null;if(!elements.has(selector))elements.set(selector,{dataset:{},innerHTML:'',textContent:'',hidden:false,disabled:false,scrollTop:0,scrollLeft:0,style:{setProperty(){}},setAttribute(){},focus(){}});return elements.get(selector);}
 const env={...bindings,structuredClone,document:{activeElement:null,querySelector:element,querySelectorAll:()=>[]},matchMedia:()=>({matches:true}),window:{confirm:()=>true},setTimeout:fn=>{timers.set(++next,fn);return next;},clearTimeout:id=>timers.delete(id)};
 const run=runInThisContext(`(function(${Object.keys(env).join(',')}){${source.replace(/^import .*;\n/gm,'')};return {get:()=>({mission,program,target,session,imported,completed:[...completed]})};})`),api=run(...Object.values(env));
 const button=dataset=>({dataset,disabled:false,hidden:false,closest(){return this;}});
 return {element,timers,get:()=>structuredClone(api.get()),add:type=>element('.palette').onclick({target:button({add:type})}),addLoop:id=>element('.palette').onclick({target:button({loopOption:id})}),inlineMove:target=>element('#program').onclick({target:button({inlineAdd:'move',target})}),next(){const [id,fn]=timers.entries().next().value??[];if(fn){timers.delete(id);fn();}},async import(mission,name='mission.json'){const text=typeof mission==='string'?mission:serializeMission(mission);await element('#import-mission').onchange({target:{files:[{name,size:new TextEncoder().encode(text).length,text:async()=>text}],value:name}});}};
}
