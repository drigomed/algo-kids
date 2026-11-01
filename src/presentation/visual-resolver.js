import {asset} from './asset-registry.js';
import {themeConfig} from './theme-config.js';
import {passage,cellProperties} from '../rules.js';
import {objectProperties} from '../properties.js';
const directions={N:'n',L:'e',S:'s',O:'w'};
const groups={button:['off','on'],lever:['off','on'],plate:['off','on'],bridge:['closed','open','overload'],door:['closed','open','locked'],gate:['closed','open'],traffic:['red','yellow','green'],station:['idle','active'],lock:['red','blue','green'],key:['red','blue','green'],terminal:['idle','active'],sign:['red','blue','green']};
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
  return {...entity,visual,badge:config.entities?.[entity.id]?.badge??null,asset:objectAsset(config.entities?.[entity.id],state,objectProperties(entity,state),fallback)};
 });
 const barriers=(mission.barriers??[]).map(barrier=>{
  const result=passage(mission,state,barrier),visual=mission.presentation?.barriers?.[barrier.id]??{};
  const group=config.barriers?.[barrier.id]?.assetGroup??config.barrierDefaults?.assetGroup;
  const safeGroup=['door','bridge','gate'].includes(group)?group:'gate';
  const failure=events.find(e=>e.type==='collision'&&e.barrierId===barrier.id);
  const overload=safeGroup==='bridge'&&(failure?.reason==='capacityExceeded'||result.failureCode==='capacityExceeded');
  const status=overload?'overload':result.passable?'open':safeGroup==='door'&&(failure?.reason==='locked'||result.failureCode==='locked')?'locked':'closed';
  return {...barrier,visual,open:result.passable,asset:asset(`reactive/${safeGroup}_${status}`,`reactive/${safeGroup}_closed`)};
 });
 const features=(mission.grid.cells??[]).flatMap(cell=>Object.entries(cellProperties(mission,state,cell)).map(([name,value])=>{
  const metadata=mission.presentation?.properties?.[name]??{},choice=metadata.values?.find(item=>item.value===value);
  const configuration=config.properties?.[name];
  return {row:cell.row,col:cell.col,name,value,label:`${metadata.label??'Marca'}: ${choice?.label??String(value)}`,glyph:choice?.glyph??'◇',asset:configuration?objectAsset(configuration,state,cellProperties(mission,state,cell),'reactive/sign_red'):null};
 }));
 return {config,robot:{...robotAsset,skin:config.robotSkin,direction:directions[state.direction]??'n'},goal:asset(`goals/${config.goalSkin}`,'goals/star'),obstacle:asset(`obstacles/${config.obstacleSkin}`),environment:{theme:config.environmentTheme},entities,barriers,features,terrain:(row,col)=>asset(`tiles/${config.environmentTheme}/${terrainVariant(row,col,config.environmentTheme)}`)};
}
export function resultPresentation(state,{completed=false,interrupted=false}={}) {
 if(interrupted||state.status==='stopped')return {kind:'interrupted',icon:asset('ui/interrupted'),title:'Interrompido por você',fx:'stopped-pause',mood:'rest'};
 if(state.status==='won')return {kind:completed?'success':'variant',icon:asset('ui/success'),title:completed?'Missão concluída!':'Esta versão passou!',fx:completed?'success-burst':null,mood:'celebrate'};
 if(state.status==='stalled')return {kind:'stalled',icon:asset('ui/stalled'),title:'Vamos sair da repetição?',fx:'stalled-loop',mood:'stalled'};
 if(state.status==='finished')return {kind:'incomplete',icon:asset('ui/incomplete'),title:'Ainda falta chegar à meta',fx:null,mood:'idle'};
 if(['collision','actionFailed','limit'].includes(state.status))return {kind:state.status,icon:asset('ui/failure'),title:{collision:'O caminho foi bloqueado',actionFailed:'Esta ação precisa de um ajuste',limit:'Foram muitos passos'}[state.status],fx:state.status==='collision'?'failure-impact':null,mood:state.status==='limit'?'stalled':'error'};
 return null;
}
