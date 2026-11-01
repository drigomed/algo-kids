// Esquemas de FORMULÁRIOS, não validadores de regras. A autoridade continua no motor.
import {decisionTypes} from '../condition-options.js';
import {numberOperators} from '../numbers.js';
import {assetRegistry} from '../presentation/asset-registry.js';
const str=(value='')=>({kind:'string',default:value});
const num=(value=0)=>({kind:'number',default:value});
const bool=(value=false)=>({kind:'boolean',default:value});
const en=(values)=>({kind:'string',enum:values,default:values[0]});
const obj=(fields,required=Object.keys(fields))=>({kind:'object',fields,required});
const list=item=>({kind:'array',item});
const dict=item=>({kind:'dict',item});
const union=(key,choices)=>({kind:'union',key,choices});
export const scalar={kind:'scalar'};
const point=obj({row:num(4),col:num(0)});
const position=obj({row:num(4),col:num(0),direction:en(['N','L','S','O'])});
const operand=union('kind',{literal:obj({kind:str('literal'),value:num()}),worldVariable:obj({kind:str('worldVariable'),name:str('contador')}),memoryVariable:obj({kind:str('memoryVariable'),name:str('observado')}),barrierProperty:obj({kind:str('barrierProperty'),name:str('capacidade')})});
const condition=union('type',{
 pathClear:obj({type:str('pathClear')}),atGoal:obj({type:str('atGoal')}),
 stateAtLeast:obj({type:str('stateAtLeast'),variable:str('collectedCount'),value:num(1)}),
 stateEquals:obj({type:str('stateEquals'),variable:str('liberada'),value:bool(true)}),
 memoryEquals:obj({type:str('memoryEquals'),variable:str('observado'),value:scalar}),
 cellPropertyEquals:obj({type:str('cellPropertyEquals'),relativeTo:en(['front']),property:str('marca'),value:scalar}),
 numberCompare:obj({type:str('numberCompare'),left:operand,operator:en(numberOperators),right:operand}),
 all:obj({type:str('all'),conditions:list('condition')})
});
const effect=union('$shape',{
 set:obj({type:str('set'),variable:str('contador'),value:scalar}),
 increment:obj({type:str('increment'),variable:str('contador'),amount:num(1)}),
 guarded:obj({when:'condition',actions:list('effect')})
});
const property={kind:'property'};
const interaction=obj({id:str('acionar'),relativeTo:list(en(['front','here'])),once:bool(),consume:bool(),when:'condition',effects:list('effect')},['id','relativeTo','effects']);
const entity=obj({id:str('objeto'),row:num(4),col:num(1),collectible:bool(),onEnter:list('effect'),properties:dict(property),interactions:list(interaction)},['id','row','col','collectible','onEnter']);
const barrier=obj({id:str('passagem'),row:num(4),col:num(2),properties:dict(property),passableWhen:'condition',failureCode:str('blocked')},['id','row','col','passableWhen']);
const grid=obj({width:num(5),height:num(5),obstacles:list(point),cells:list(obj({row:num(),col:num(),properties:dict(property)}))},['width','height','obstacles']);
const source=obj({type:en(['cellProperty','entityProperty','barrierProperty']),relativeTo:en(['front','here']),property:str('marca'),entityId:str('objeto'),barrierId:str('passagem')},['type','relativeTo','property']);
const command=union('type',{inspect:obj({type:str('inspect'),source,into:str('observado')}),setMemory:obj({type:str('setMemory'),variable:str('observado'),value:scalar}),interact:obj({type:str('interact'),relativeTo:en(['front','here']),actionId:str('acionar'),entityId:str('objeto')},['type','relativeTo','actionId'])});
const valueLabel=obj({value:scalar,label:str('Resposta'),question:str('Pergunta?')},['value','label']);
const selector=obj({kind:en(['worldVariable','memoryVariable']),name:str('contador')});
const visualState={kind:'visualState'};
export const visualGroups=[...new Set(Object.keys(assetRegistry).filter(id=>id.startsWith('reactive/')).map(id=>id.split('/')[1].split('_')[0])),...Object.keys(assetRegistry).filter(id=>id.startsWith('collectibles/')).map(id=>id.split('/')[1])];
const visualObject=obj({assetGroup:en(visualGroups),state:visualState,badge:str()},['assetGroup']);
const visual=obj({chapter:en(['navigator','collector','reactive','advanced']),robotSkin:en(['mk1','mk2','mk3','mk4']),environmentTheme:en(['grass','trail','yard','factory','parking']),goalSkin:en(['star','beacon','landing-pad']),obstacleSkin:en(['rock','crate','cone','bollard']),entities:dict(visualObject),barriers:dict(visualObject),properties:dict(visualObject),barrierDefaults:visualObject},[]);
const presentation=obj({visual,entityGlyph:str('●'),entityLabel:str('Objeto'),variables:dict(str()),memory:dict(obj({label:str('Informação'),values:list(valueLabel)},['label'])),entities:dict(obj({label:str('Objeto'),glyph:str('●'),role:en(['collectible','trigger','delivery']),propertyLabels:dict(str()),interactionMessage:str(),messages:obj({entered:str(),collected:str()},[]),guardMessages:dict(str()),failureMessages:dict(str())},['label'])),barriers:dict(obj({label:str('Passagem'),openGlyph:str('▯'),closedGlyph:str('▥'),propertyLabels:dict(str()),failureMessages:dict(str())},['label'])),properties:dict(obj({label:str('Marca'),values:list(obj({value:scalar,label:str('Valor'),glyph:str('◇'),tone:en(['green','red','amber','neutral'])},['value','label']))},['label'])),progress:obj({variable:str('collectedCount'),target:num(1)}),stateIndicators:list(obj({variable:str('contador'),label:str('Quantidade'),values:list(valueLabel)},['variable','label'])),stateMessages:dict(list(obj({value:scalar,message:str()}))),failures:dict(str())},[]);
export const missionSchema=obj({id:str('studio-missao'),title:str('Minha missão'),instructions:str('Chegue até a meta.'),hint:str('Observe a direção do robô.'),demo:bool(),grid,start:position,goal:point,initialVariables:dict(scalar),robotMemory:dict(obj({type:en(['number','boolean','string']),initial:{kind:'nullable'}})),entities:list(entity),barriers:list(barrier),winCondition:'condition',commandOptions:list(obj({id:str('comando'),label:str('Comando'),node:command,values:list(valueLabel)},['id','label','node'])),conditionOptions:list(obj({id:str('pergunta'),label:str('Pergunta?'),condition:'condition',values:list(valueLabel)},['id','label','condition'])),switchOptions:list(obj({id:str('escolha'),label:str('Escolher'),selector,cases:list(obj({value:scalar,label:str('Caso')})),defaultLabel:str('Outro valor')},['id','label','selector','cases'])),loopOptions:list(union('kind',{for:obj({id:str('repetir'),label:str('Repetir'),kind:str('for'),times:num(4)}),while:obj({id:str('enquanto'),label:str('Enquanto'),kind:str('while'),condition:'condition'})})),solution:{kind:'program'},variants:list('variant'),presentation},['id','title','instructions','hint','grid','start','goal','solution']);
const variant=obj({...missionSchema.fields,id:str('cenario'),label:str('Cenário')},['id','label']);delete variant.fields.variants;delete variant.fields.solution;
visual.fields.variantLooks=dict('visual');
const references={condition,effect,variant,visual};
export function schemaOf(schema,value,path=[]) {
 if(typeof schema==='string')schema=references[schema];
 if(!schema)return typeof value==='object'?(Array.isArray(value)?list(scalar):dict(scalar)):scalar;
 if(schema===visualObject&&(path.includes('barriers')||path.includes('barrierDefaults')))return obj({...schema.fields,assetGroup:en(['door','bridge','gate'])},['assetGroup']);
 if(schema===condition){const physical=path.includes('passableWhen'),decision=path.includes('conditionOptions');return {...schema,choices:Object.fromEntries(Object.entries(schema.choices).filter(([key])=>physical?['stateEquals','stateAtLeast','numberCompare','all'].includes(key):decision?decisionTypes.includes(key):true))};}
 if(schema===operand&&path.includes('passableWhen'))return {...schema,choices:Object.fromEntries(Object.entries(operand.choices).filter(([key])=>key!=='memoryVariable'))};
 return schema;
}
export function concrete(schema,value,path=[]) {
 schema=schemaOf(schema,value,path);
 if(schema.kind==='property'&&value&&typeof value==='object')return obj({stateVariable:str('contador')});
 if(schema.kind==='visualState'&&value&&typeof value==='object')return obj({source:en(['variable','property']),name:str('liberada'),values:list(obj({value:scalar,state:en(['off','on','closed','open','overload','locked','red','blue','green','yellow','idle','active'])}))});
 if(schema.kind==='union'){const key=schema.key==='$shape'?(value?.when?'guarded':value?.type):value?.[schema.key];return schema.choices[key]??Object.values(schema.choices)[0];}
 return schema;
}
export function defaultValue(schema,choice,path=[]) {
 schema=schemaOf(schema,undefined,path);
 if(schema.kind==='union')return defaultValue(schema.choices[choice]??Object.values(schema.choices)[0],undefined,path);
 if(schema.kind==='array'||schema.kind==='program')return [];
 if(schema.kind==='dict')return {};
 if(schema.kind==='object')return Object.fromEntries(schema.required.map(key=>[key,defaultValue(schema.fields[key],undefined,[...path,key])]));
 if(schema.kind==='property'||schema.kind==='scalar'||schema.kind==='visualState')return '';
 if(schema.kind==='nullable')return null;
 return schema.default??'';
}
export function schemaAt(root,path) {
 let schema=missionSchema,value=root;
 for(let i=0;i<path.length;i++){schema=concrete(schema,value,path.slice(0,i));const key=path[i];schema=schema.kind==='array'?schema.item:schema.kind==='dict'?schema.item:schema.fields?.[key];value=value?.[key];}
 return schemaOf(schema,value,path);
}
export const labels={mission:'Missão',id:'Identificador',title:'Título',instructions:'Instruções',hint:'Dica',grid:'Tabuleiro',start:'Início do robô',goal:'Meta',initialVariables:'Variáveis do mundo',robotMemory:'Memória do robô',entities:'Entidades',barriers:'Barreiras',winCondition:'Condição adicional de vitória',commandOptions:'Comandos autorizados',conditionOptions:'Perguntas do SE',switchOptions:'Opções ESCOLHA',loopOptions:'Repetições autorizadas',solution:'Solução de referência',variants:'Variantes',presentation:'Aparência e rótulos',onEnter:'Efeitos ao entrar',effects:'Efeitos',when:'Condição',actions:'Ações da guarda',passableWhen:'Passagem livre quando',properties:'Propriedades',interactions:'Interações',row:'Linha (começa em 0)',col:'Coluna (começa em 0)',collectible:'Coletável',once:'Uso único',consume:'Consumir objeto',width:'Largura',height:'Altura',direction:'Direção',value:'Valor',initial:'Valor inicial',relativeTo:'Alcances',state:'Estado visual',source:'Fonte',into:'Guardar em',type:'Tipo',label:'Rótulo'};
