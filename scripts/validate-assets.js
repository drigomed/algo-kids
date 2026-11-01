import {readFile,readdir,lstat} from 'node:fs/promises';
import {resolve,relative} from 'node:path';
import {pathToFileURL} from 'node:url';
import assert from 'node:assert/strict';
import {assetRegistry} from '../src/presentation/asset-registry.js';
// Dialeto vetorial deliberadamente pequeno. Sem CSS, referências ou conteúdo executável.
const tags=new Set(['svg','g','rect','circle','ellipse','path','polygon']);
const allowed=new Set(['xmlns','viewBox','width','height','x','y','cx','cy','r','rx','ry','d','points','fill','stroke','stroke-width','stroke-linecap','stroke-linejoin','opacity','transform']);
export function validateSvg(source,label='SVG') {
 assert(typeof source==='string'&&source.length<12*1024,`${label}: tamanho inválido`);
 assert(!/[<!?](?:!|\?)/.test(source)&&!source.includes('&')&&!/\b(?:script|foreignObject|javascript|data:|url\s*\(|@import|onload|onclick)\b/i.test(source),`${label}: conteúdo ativo ou referência proibida`);
 const stack=[];let cursor=0,root=false,shapes=0;
 for(const match of source.matchAll(/<([^<>]+)>/g)) {
  assert(!source.slice(cursor,match.index).trim(),`${label}: texto/XML não permitido`);cursor=match.index+match[0].length;
  const token=match[1],closing=token.startsWith('/'),self=token.endsWith('/');
  if(closing){assert(/^\/[a-z]+$/.test(token)&&stack.pop()===token.slice(1),`${label}: fechamento inválido`);continue;}
  const start=token.match(/^([a-z]+)(?=\s|\/|$)/);assert(start&&tags.has(start[1]),`${label}: elemento não permitido`);const name=start[1];
  if(!root){assert(name==='svg',`${label}: raiz ausente`);root=true;}else assert(stack.length&&name!=='svg',`${label}: raiz duplicada`);
  const attributes=token.slice(name.length).replace(/\/$/,'');let at=0;const seen=new Set(),values={};
  for(const entry of attributes.matchAll(/([\w-]+)="([^"]*)"/g)) {
   assert(/^\s+$/.test(attributes.slice(at,entry.index)),`${label}: atributo malformado`);at=entry.index+entry[0].length;
   const [,key,value]=entry;assert(allowed.has(key)&&!seen.has(key),`${label}: atributo proibido ${key}`);seen.add(key);values[key]=value;
   if(key==='xmlns')assert(name==='svg'&&value==='http://www.w3.org/2000/svg',`${label}: namespace inválido`);
   else if(['fill','stroke'].includes(key))assert(/^(?:none|#[0-9a-f]{3,8})$/i.test(value),`${label}: cor/referência inválida`);
   else if(key==='d')assert(/^[MmLlHhVvCcSsQqTtAaZz\d\s.,eE+-]+$/.test(value),`${label}: caminho inválido`);
   else if(key==='transform')assert(/^(?:(?:translate|scale)\([-+\d. ,]+\)\s*)+$/.test(value),`${label}: transformação inválida`);
   else if(['stroke-linecap','stroke-linejoin'].includes(key))assert(['round','butt','square','miter','bevel'].includes(value),`${label}: contorno inválido`);
   else assert(/^[-+\d.eE ,]+$/.test(value),`${label}: valor vetorial inválido`);
  }
  assert(!attributes.slice(at).trim(),`${label}: atributos não analisados`);
  if(name==='path')assert(values.d,`${label}: caminho vazio`);
  if(name==='rect')assert(Number(values.width)>0&&Number(values.height)>0,`${label}: retângulo vazio`);
  if(name==='circle')assert(Number(values.r)>0,`${label}: círculo vazio`);
  if(name==='svg')assert(values.xmlns&&['0 0 64 64','0 0 128 128'].includes(values.viewBox),`${label}: viewBox/namespace inválido`);
  if(!['svg','g'].includes(name))shapes++;
  if(!self)stack.push(name);
 }
 assert(root&&stack.length===0&&!source.slice(cursor).trim()&&shapes>=2,`${label}: SVG incompleto ou sem ilustração`);
 return true;
}
export async function validateAssets(root='.') {
 const directory=resolve(root,'src/assets'),expected=new Set(Object.values(assetRegistry));
 assert(expected.size===85,'Catálogo deve conter exatamente 85 arquivos');
 const actual=new Set();let bytes=0;
 async function walk(path) {
  const stat=await lstat(path);assert(!stat.isSymbolicLink(),`Link simbólico: ${path}`);
  if(stat.isDirectory()){for(const name of await readdir(path))await walk(resolve(path,name));return;}
  assert(stat.isFile(),`Recurso irregular: ${path}`);
  const file=relative(directory,path).split('\\').join('/');assert(expected.has(file),`Asset fora do catálogo: ${file}`);
  const source=await readFile(path,'utf8');validateSvg(source,file);actual.add(file);bytes+=stat.size;
 }
 await walk(directory);for(const file of expected)assert(actual.has(file),`Asset ausente: ${file}`);
 assert(bytes<750*1024,'Biblioteca excessiva');return {files:actual.size,bytes};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){const report=await validateAssets(process.argv[2]??'.');console.log(`Assets validados: ${report.files} SVGs originais, ${report.bytes} bytes.`);}
