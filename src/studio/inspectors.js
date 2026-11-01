import {escapeHtml as h} from '../html.js';
import {schemaOf,concrete,schemaAt,defaultValue,labels} from './authoring-schema.js';
import {at} from './model.js';
export const pathAttribute=path=>h(JSON.stringify(path));
const label=key=>labels[key]??String(key);
const options=(values,current)=>values.map(value=>`<option value="${h(value)}" ${value===current?'selected':''}>${h(value)}</option>`).join('');
export function scalarControl(value,path,schema={kind:'scalar'}){
 const id=pathAttribute(path),type=value===null?'null':typeof value,lock=schema.enum;
 if(lock)return `<select data-value="${id}" data-kind="string" aria-label="${h(label(path.at(-1)))}">${options(lock,value)}</select>`;
 const typed=['scalar','nullable','property','visualState'].includes(schema.kind);
 const types=['string','number','boolean',...(schema.kind==='nullable'?['null']:[]),...(schema.kind==='property'?['binding']:[]),...(schema.kind==='visualState'?['selector']:[])];
 return `${typed?`<select data-value-type="${id}" aria-label="Tipo de ${h(label(path.at(-1)))}">${options(types,type==='object'?schema.kind==='property'?'binding':'selector':type)}</select>`:''}${type==='boolean'?`<select data-value="${id}" data-kind="boolean" aria-label="${h(label(path.at(-1)))}">${options(['true','false'],String(value))}</select>`:value===null?'<span class="studio-muted">Desconhecido (null)</span>':`<input data-value="${id}" data-kind="${type}" type="${type==='number'?'number':'text'}" ${type==='number'?'step="any"':''} value="${h(value)}" aria-label="${h(label(path.at(-1)))}">`}`;
}
export function readTyped(kind,value){if(kind==='boolean')return value==='true';if(kind==='number'){if(value.trim()===''||!Number.isFinite(Number(value)))throw new Error('Informe um número finito');return Number(value);}if(kind==='null')return null;return value;}
export function typeDefault(type){return {string:'',number:0,boolean:false,null:null,binding:{stateVariable:'contador'},selector:{source:'variable',name:'liberada',values:[{value:true,state:'on'},{value:false,state:'off'}]}}[type];}
function summary(value){return Array.isArray(value)?`${value.length} itens`:value&&typeof value==='object'?String(value.label??value.id??value.type??value.assetGroup??'Configurar campos'):String(value);}
export function renderInspector(mission,path,{basic=false}={}){
 let value;try{value=at(mission,path);}catch{return '<p>Escolha um elemento existente.</p>';}
 let schema=schemaAt(mission,path),resolved=concrete(schema,value,path);
 const head=`<nav class="studio-breadcrumb" aria-label="Caminho de edição"><button data-open="[]">Missão</button>${path.map((key,i)=>`<button data-open="${pathAttribute(path.slice(0,i+1))}">${h(label(key))}</button>`).join('')}</nav><h3>${h(label(path.at(-1)??'mission'))}</h3>`;
 if(!value||typeof value!=='object')return head+scalarControl(value,path,schema);
 if(resolved.kind==='program')return head+'<p>Use a aba Programa / teste para montar os blocos.</p>';
 const representation=['property','visualState'].includes(schema.kind)?`<label>Representação<select data-value-type="${pathAttribute(path)}">${options(schema.kind==='property'?['binding','string','number','boolean']:['selector','string'],schema.kind==='property'?'binding':'selector')}</select></label>`:'';
 const union=schema.kind==='union'?`<label>Estrutura<select data-union="${pathAttribute(path)}">${options(Object.keys(schema.choices),schema.key==='$shape'?(value.when?'guarded':value.type):value[schema.key])}</select></label>`:'';
 if(schema.kind==='property')resolved={kind:'object',fields:{stateVariable:{kind:'string'}},required:['stateVariable']};
 if(schema.kind==='visualState')resolved={kind:'object',fields:{source:{kind:'string',enum:['variable','property']},name:{kind:'string'},values:{kind:'array',item:{kind:'object',fields:{value:{kind:'scalar'},state:{kind:'string',enum:['off','on','closed','open','overload','locked','red','blue','green','yellow','idle','active']}},required:['value','state']}}},required:['source','name','values']};
 const basicKeys=['id','title','instructions','hint','grid','start','goal','entities','presentation','solution'];
 const rows=Object.entries(value).filter(([key])=>!basic||path.length||basicKeys.includes(key)).filter(([key])=>schema.kind!=='union'||key!==schema.key).map(([key,item])=>{
  const child=[...path,Array.isArray(value)?Number(key):key],s=schemaOf(resolved.kind==='array'||resolved.kind==='dict'?resolved.item:resolved.fields?.[key],item,child);
  return `<div class="studio-field"><strong>${h(label(key))}</strong>${item&&typeof item==='object'?`<button data-open="${pathAttribute(child)}">Editar · ${h(summary(item))}</button>`:scalarControl(item,child,s)}<button data-delete="${pathAttribute(child)}" aria-label="Excluir ${h(label(key))}">Excluir</button>${Array.isArray(value)?`<button data-reorder="${pathAttribute(child)}" data-offset="-1" ${Number(key)===0?'disabled':''}>↑</button><button data-reorder="${pathAttribute(child)}" data-offset="1" ${Number(key)===value.length-1?'disabled':''}>↓</button>`:''}</div>`;
 }).join('');
 let add='';
 if(resolved.kind==='array')add=`<button data-add-item="${pathAttribute(path)}">+ Adicionar item</button>`;
 else if(resolved.kind==='dict'||!resolved.fields)add=`<label>Nome do novo campo<input id="new-key" autocomplete="off"></label><button data-add-key="${pathAttribute(path)}">+ Adicionar campo</button>`;
 else {const absent=Object.keys(resolved.fields).filter(key=>(!basic||path.length||basicKeys.includes(key))&&!Object.hasOwn(value,key));if(absent.length)add=`<label>Adicionar campo<select id="new-field">${absent.map(key=>`<option value="${h(key)}">${h(label(key))}</option>`).join('')}</select></label><button data-add-field="${pathAttribute(path)}">+ Adicionar campo</button>`;}
 const rename=path.length===1&&['initialVariables','robotMemory'].includes(path[0])?'<fieldset><legend>Renomear declaração sem referências</legend><label>Nome atual<input id="rename-old"></label><label>Novo nome<input id="rename-new"></label><button id="rename-variable">Renomear (verificar dependências)</button></fieldset>':'';
 return head+representation+union+rows+add+rename;
}
export function defaultForItem(mission,path){const schema=concrete(schemaAt(mission,path),at(mission,path),path);return defaultValue(schema.item,undefined,[...path,at(mission,path).length]);}
