import {presentedProperties,presentedState,observationPending,mapDetails} from './map-identification.js';
import {asset} from './asset-registry.js';
import {themeConfig} from './theme-config.js';
import {passage,cellProperties} from '../rules.js';
import {objectProperties} from '../properties.js';
const directions={N:'n',L:'e',S:'s',O:'w'};
const groups={shapekey:['redround','redsquare','blueround','bluesquare'],stack:['idle'],bin:['idle'],button:['off','on'],lever:['off','on'],plate:['off','on'],bridge:['closed','open','overload'],door:['closed','open','locked'],gate:['closed','open'],traffic:['red','yellow','green'],station:['idle','active'],lock:['red','blue','green'],key:['red','blue','green'],terminal:['idle','active'],sign:['red','blue','green']};
const own=(object,key)=>object&&Object.hasOwn(object,key)?object[key]:undefined;
function selectedState(binding,state,properties) {
 if(typeof binding==='string')return binding;
 if(!binding||!['variable','property'].includes(binding.source)||typeof binding.name!=='string')return undefined;
 const value=own(binding.source==='variable'?state.variables:properties,binding.name);
 return Array.isArray(binding.values)?binding.values.find(item=>item&&typeof item==='object'&&item.value===value)?.state:undefined;
}
function objectAsset(config,state,properties,fallback='collectibles/chip') {
 const group=config?.assetGroup;
 if(['crystal','battery','gear','package','chip'].includes(group))return asset(`collectibles/${group}`,fallback);
 if(!Object.hasOwn(groups,group))return asset(fallback);
 const choice=selectedState(config.state,state,properties),safe=groups[group].includes(choice)?choice:groups[group][0];
 return asset(`reactive/${group}_${safe}`,fallback);
}
export function terrainVariant(row,col,theme) {return ['a','b','c'][(row*7+col*11+[...theme].reduce((sum,c)=>sum+c.charCodeAt(0),0))%3];}
export function resolveScene(mission,state,overrides={}) {
 const config=themeConfig(mission,overrides),events=state.events??[];
 const robotAsset=asset(`robots/${config.robotSkin}/${directions[state.direction]??'n'}`,'robots/mk1/n');
 const entities=(mission.entities??[]).filter(entity=>!state.consumedIds.includes(entity.id)&&!(entity.collectible&&state.collectedIds.includes(entity.id))).map(entity=>{
  const visual=mission.presentation?.entities?.[entity.id]??{};
  const fallback=entity.collectible?'collectibles/crystal':visual.role==='delivery'?'reactive/station_idle':'reactive/terminal_idle';
  const descriptor=config.entities?.[entity.id],quantity=descriptor?.quantity;
  const amount=quantity?own(quantity.source==='variable'?presentedState(entity,state,descriptor).variables:presentedProperties(entity,state,descriptor),quantity.name):undefined;
  const number=Number.isSafeInteger(amount)&&amount>=0&&amount<=10000?amount:undefined;
  return {...entity,visual,...(number!==undefined?{quantity:number,quantityEmpty:quantity.empty??'show'}:{}),badge:config.entities?.[entity.id]?.badge??null,details:mapDetails(descriptor,presentedState(entity,state,descriptor),presentedProperties(entity,state,descriptor)),asset:observationPending(descriptor,state)?asset('reactive/terminal_idle'):objectAsset(descriptor,presentedState(entity,state,descriptor),presentedProperties(entity,state,descriptor),fallback)};
 });
 const barriers=(mission.barriers??[]).map(barrier=>{
  const result=passage(mission,state,barrier),visual=mission.presentation?.barriers?.[barrier.id]??{};
  const group=config.barriers?.[barrier.id]?.assetGroup??config.barrierDefaults?.assetGroup;
  const safeGroup=['door','bridge','gate'].includes(group)?group:'gate';
  const failure=events.find(e=>e.type==='collision'&&e.barrierId===barrier.id);
  const overload=safeGroup==='bridge'&&(failure?.reason==='capacityExceeded'||result.failureCode==='capacityExceeded');
  const status=overload?'overload':result.passable?'open':safeGroup==='door'&&(failure?.reason==='locked'||result.failureCode==='locked')?'locked':'closed';
  const descriptor=config.barriers?.[barrier.id]??{};
  return {...barrier,visual,badge:descriptor.badge??null,properties:presentedProperties(barrier,state,descriptor),details:mapDetails(descriptor,presentedState(barrier,state,descriptor),presentedProperties(barrier,state,descriptor)),open:result.passable,asset:asset(`reactive/${safeGroup}_${status}`,`reactive/${safeGroup}_closed`)};
 });
 const features=(mission.grid.cells??[]).flatMap(cell=>Object.entries(cellProperties(mission,state,cell)).map(([name,value])=>{
  const configuration=config.properties?.[name],shown=presentedProperties(cell,state,configuration)[name];
  const metadata=mission.presentation?.properties?.[name]??{},choice=metadata.values?.find(item=>item.value===shown),pending=observationPending(configuration,state);
  return {row:cell.row,col:cell.col,name,value:shown,displayValue:choice?.label??String(shown),badge:configuration?.badge??null,label:`${metadata.label??'Marca'}: ${choice?.label??String(shown)}`,glyph:pending?'?':choice?.glyph??'◇',asset:pending?asset('reactive/terminal_idle'):configuration?objectAsset(configuration,presentedState(cell,state,configuration),presentedProperties(cell,state,configuration),'reactive/sign_red'):null};
 }));
 return {config,robot:{...robotAsset,skin:config.robotSkin,direction:directions[state.direction]??'n'},goal:asset(`goals/${config.goalSkin}`,'goals/star'),obstacle:asset(`obstacles/${config.obstacleSkin}`),environment:{theme:config.environmentTheme},entities,barriers,features,terrain:(row,col)=>asset(`tiles/${config.environmentTheme}/${terrainVariant(row,col,config.environmentTheme)}`)};
}
export function resultPresentation(state,{completed=false,interrupted=false}={}) {
 if(interrupted||state.status==='stopped')return {kind:'interrupted',icon:asset('ui/interrupted'),title:'Interrompido por você',fx:'stopped-pause',mood:'rest'};
 if(state.status==='won')return {kind:completed?'success':'variant',icon:asset('ui/success'),title:completed?'Missão concluída!':'Esta versão passou!',fx:completed?'success-burst':null,mood:'celebrate'};
 if(state.status==='energyDepleted')return {kind:'energyDepleted',icon:asset('collectibles/battery'),title:'A bateria acabou!',fx:null,mood:'rest'};
 if(state.status==='stalled')return {kind:'stalled',icon:asset('ui/stalled'),title:'Vamos sair da repetição?',fx:'stalled-loop',mood:'stalled'};
 if(state.status==='finished')return {kind:'incomplete',icon:asset('ui/incomplete'),title:'Ainda falta chegar à meta',fx:null,mood:'idle'};
 if(['collision','actionFailed','limit'].includes(state.status))return {kind:state.status,icon:asset('ui/failure'),title:{collision:'O caminho foi bloqueado',actionFailed:'Esta ação precisa de um ajuste',limit:'Foram muitos passos'}[state.status],fx:state.status==='collision'?'failure-impact':null,mood:state.status==='limit'?'stalled':'error'};
 return null;
}
