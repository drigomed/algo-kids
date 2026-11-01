import {assertJsonData,validVariable} from '../data.js';
import {validateMission} from '../engine.js';
import {missionVariants} from '../missions.js';
const safe=key=>!['__proto__','constructor','prototype'].includes(String(key));
export function at(root,path){let value=root;for(const key of path){if(!safe(key)||value==null||!Object.hasOwn(value,key))throw new Error('Caminho inexistente ou inseguro');value=value[key];}return value;}
export function assign(root,path,value){if(!path.length)throw new Error('Use substituir documento');const parent=at(root,path.slice(0,-1)),key=path.at(-1);if(!safe(key))throw new Error('Campo inseguro');parent[key]=value;}
export function newMission(){return {id:'studio-missao',title:'Minha missão',instructions:'Chegue até a meta.',hint:'Observe a direção do robô.',grid:{width:5,height:5,obstacles:[]},start:{row:4,col:0,direction:'L'},goal:{row:4,col:3},solution:[],presentation:{visual:{chapter:'navigator',robotSkin:'mk1',environmentTheme:'grass',goalSkin:'star',obstacleSkin:'rock'}}};}
export function createDraft(mission=newMission()){assertJsonData(mission);return {mission:structuredClone(mission),past:[],future:[],revision:0};}
export function transact(draft,change){const next=structuredClone(draft.mission);change(next);assertJsonData(next);if(JSON.stringify(next)===JSON.stringify(draft.mission))return draft;return {mission:next,past:[...draft.past,draft.mission].slice(-25),future:[],revision:draft.revision+1};}
export function undo(d){return d.past.length?{mission:d.past.at(-1),past:d.past.slice(0,-1),future:[d.mission,...d.future].slice(0,25),revision:d.revision+1}:d;}
export function redo(d){return d.future.length?{mission:d.future[0],past:[...d.past,d.mission].slice(-25),future:d.future.slice(1),revision:d.revision+1}:d;}
export function resolved(mission,index=-1){return index<0?structuredClone(mission):structuredClone(missionVariants(mission)[index]);}
export function editScenario(mission,index,field,change){
 const scenario=resolved(mission,index),next=structuredClone(scenario[field]);change(next);
 if(index<0)mission[field]=next;else mission.variants[index][field]=next;
}
export function inheritField(mission,index,field){if(index<0)throw new Error('Escolha uma variante');delete mission.variants[index][field];}
export function dependencies(root,name){const found=[];function visit(value,path){if(value&&typeof value==='object')for(const [key,item] of Object.entries(value)){if(['variable','stateVariable','name','into'].includes(key)&&item===name)found.push([...path,key]);visit(item,[...path,Array.isArray(value)?Number(key):key]);}}visit(root,[]);return found;}
export function renameDeclaration(root,namespace,oldName,newName){
 if(!validVariable(newName))throw new Error('Nome reservado ou inválido');if(oldName===newName)return;
 const declarations=root[namespace]??{};if(!Object.hasOwn(declarations,oldName)||Object.hasOwn(declarations,newName))throw new Error('Nome ausente ou duplicado');
 const refs=dependencies(root,oldName);if(refs.length){const error=new Error(`Renomeação bloqueada: ${refs.map(path=>path.join('.')).join(', ')}`);error.paths=refs;throw error;}
 declarations[newName]=declarations[oldName];delete declarations[oldName];
}
export function removeAt(root,path,confirmed=false){const value=at(root,path),key=path.at(-1),parent=at(root,path.slice(0,-1));
 if(path.length===2&&['initialVariables','robotMemory'].includes(path[0])&&dependencies(root,key).length)throw new Error('Há referências a esta variável. Remova ou altere as dependências antes de excluir.');
 if(!confirmed&&value&&typeof value==='object'&&Object.keys(value).length)throw new Error('Confirme a exclusão deste item e dos dados internos.');
 if(Array.isArray(parent)){parent.splice(key,1);if(!parent.length&&path.length===2&&['variants','conditionOptions'].includes(path[0]))delete root[path[0]];}else delete parent[key];
}
const nextId=m=>{const used=new Set([...(m.entities??[]),...(m.barriers??[])].map(o=>o.id));let i=1;while(used.has(`objeto${i}`))i++;return `objeto${i}`;};
function geometry(m){validateMission({grid:{...m.grid,...(m.grid.cells?{cells:m.grid.cells.map(c=>({...c,properties:{}}))}:{})},start:m.start,goal:m.goal,entities:(m.entities??[]).map(e=>({id:e.id,row:e.row,col:e.col,collectible:!!e.collectible,onEnter:[]})),barriers:(m.barriers??[]).map(b=>({id:b.id,row:b.row,col:b.col,passableWhen:{type:'stateAtLeast',variable:'collectedCount',value:1}}))});}
export function place(mission,index,tool,row,col,selected){
 const m=resolved(mission,index),point={row,col};let field;
 if(tool==='start'){m.start={...m.start,...point};field='start';}
 else if(tool==='goal'){m.goal=point;field='goal';}
 else if(tool==='obstacle'){if(!m.grid.obstacles.some(o=>o.row===row&&o.col===col))m.grid.obstacles.push(point);field='grid';}
 else if(tool==='sensor'){m.grid.cells??=[];if(!m.grid.cells.some(o=>o.row===row&&o.col===col))m.grid.cells.push({...point,properties:{marca:''}});field='grid';}
 else if(tool==='entity'||tool==='collectible'){m.entities??=[];m.entities.push({id:nextId(m),...point,collectible:tool==='collectible',onEnter:[]});field='entities';}
 else if(tool==='barrier'){m.barriers??=[];m.barriers.push({id:nextId(m),...point,passableWhen:{type:'stateAtLeast',variable:'collectedCount',value:1}});field='barriers';}
 else if(tool==='move'){
  if(!selected)throw new Error('Selecione primeiro um elemento no inspetor');field=selected[0];const object=at(m,selected);object.row=row;object.col=col;
 }else throw new Error('Ferramenta inválida');
 geometry(m);if(index<0)mission[field]=m[field];else mission.variants[index][field]=m[field];
}
export function resize(mission,index,width,height,confirmed=false){
 if(!Number.isInteger(width)||!Number.isInteger(height)||width<3||height<3||width>12||height>12)throw new Error('A interface permite 3 a 12 células por eixo');
 const m=resolved(mission,index),outside=p=>p.row>=height||p.col>=width,items=[...m.grid.obstacles,...(m.grid.cells??[]),...(m.entities??[]),...(m.barriers??[]),m.start,m.goal].filter(outside);
 if(items.length&&!confirmed)throw new Error(`${items.length} elementos ficariam fora. Confirme remover os objetos externos e reposicionar início/meta.`);
 m.grid={...m.grid,width,height,obstacles:m.grid.obstacles.filter(p=>!outside(p)),...(m.grid.cells?{cells:m.grid.cells.filter(p=>!outside(p))}:{})};
 for(const key of ['entities','barriers'])if(m[key])m[key]=m[key].filter(p=>!outside(p));
 for(const key of ['start','goal'])m[key]={...m[key],row:Math.min(m[key].row,height-1),col:Math.min(m[key].col,width-1)};
 geometry(m);for(const key of ['grid','entities','barriers','start','goal'])if(Object.hasOwn(m,key)){if(index<0)mission[key]=m[key];else mission.variants[index][key]=m[key];}
}
export function addVariant(mission,copy=-1){mission.variants??=[];let i=1;while(mission.variants.some(v=>v.id===`cenario${i}`))i++;const variant=copy<0?{}:structuredClone(mission.variants[copy]);mission.variants.push({...variant,id:`cenario${i}`,label:`Cenário ${i}`});}
