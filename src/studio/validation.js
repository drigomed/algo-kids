import {assertJsonData,record,validVariable,scalar} from '../data.js';
import {validateMission,validateProgram} from '../engine.js';
import {validateEffects,validateCondition,validatePassageCondition} from '../rules.js';
import {validateInteractions,validateCommandOptions} from '../commands.js';
import {validateMemory} from '../memory.js';
import {validateProperties} from '../properties.js';
import {missionVariants} from '../missions.js';
import {missionSchema,visualGroups} from './authoring-schema.js';
const visualKeys=new Set(['chapter','robotSkin','environmentTheme','goalSkin','obstacleSkin','entities','barriers','properties','barrierDefaults','variantLooks']);
const enums={chapter:['navigator','collector','reactive','advanced'],robotSkin:['mk1','mk2','mk3','mk4'],environmentTheme:['grass','trail','yard','factory','parking'],goalSkin:['star','beacon','landing-pad'],obstacleSkin:['rock','crate','cone','bollard']};
export function validateVisual(visual,path='presentation.visual'){
 if(visual===undefined)return;if(!record(visual))throw new Error(`${path}: configuração visual inválida`);
 for(const [key,value] of Object.entries(visual)){
  if(!visualKeys.has(key))throw new Error(`${path}.${key}: campo visual não autorizado`);
  if(enums[key]&&!enums[key].includes(value))throw new Error(`${path}.${key}: escolha um valor do catálogo`);
  if(['entities','barriers','properties'].includes(key)){
   if(!record(value))throw new Error(`${path}.${key}: mapa inválido`);for(const [name,item] of Object.entries(value))validateVisualObject(item,`${path}.${key}.${name}`);
  }else if(key==='barrierDefaults')validateVisualObject(value,`${path}.${key}`);
  else if(key==='variantLooks'){if(!record(value))throw new Error('Variantes visuais inválidas');for(const [id,item] of Object.entries(value))validateVisual(item,`${path}.${key}.${id}`);}
 }
}
function validateVisualObject(value,path){
 if(!record(value)||Object.keys(value).some(k=>!['assetGroup','state','badge'].includes(k))||!visualGroups.includes(value.assetGroup))throw new Error(`${path}: papel gráfico não autorizado`);
 if(Object.hasOwn(value,'badge')&&typeof value.badge!=='string')throw new Error(`${path}.badge: rótulo inválido`);
 const binding=value.state;if(binding===undefined)return;
 const states=['off','on','closed','open','overload','locked','red','blue','green','yellow','idle','active'];
 if(typeof binding==='string'){if(!states.includes(binding))throw new Error(`${path}.state: estado inválido`);return;}
 if(!record(binding)||Object.keys(binding).some(k=>!['source','name','values'].includes(k))||!['variable','property'].includes(binding.source)||!validVariable(binding.name)||!Array.isArray(binding.values)||binding.values.some(item=>!record(item)||Object.keys(item).some(k=>!['value','state'].includes(k))||!scalar(item.value)||!states.includes(item.state)))throw new Error(`${path}.state: vínculo inválido`);
}
export function diagnose(mission){
 const errors=[],warnings=[],check=(path,fn)=>{try{fn();}catch(error){errors.push({path,message:error.message});}};
 check([],()=>assertJsonData(mission,'mission'));if(errors.length)return {valid:false,errors,warnings};
 if(!record(mission))return {valid:false,errors:[{path:[],message:'Importe um objeto de missão'}],warnings};
 check([],()=>{for(const key of Object.keys(mission))if(!Object.hasOwn(missionSchema.fields,key))throw new Error(`Campo de runtime não reconhecido: ${key}`);});
 check(['id'],()=>{if(!((typeof mission.id==='string'&&mission.id.trim())||(typeof mission.id==='number'&&Number.isFinite(mission.id))))throw new Error('Identificador de autoria ausente ou inválido');});
 for(const key of ['title','instructions','hint'])check([key],()=>{if((key==='title'||Object.hasOwn(mission,key))&&typeof mission[key]!=='string')throw new Error('Metadado deve ser texto');});
 check(['demo'],()=>{if(Object.hasOwn(mission,'demo')&&typeof mission.demo!=='boolean')throw new Error('demo deve ser booleano');});
 check(['variants'],()=>{if(Array.isArray(mission.variants))for(const variant of mission.variants){if(!record(variant))continue;if(variant.label!==undefined&&typeof variant.label!=='string')throw new Error('Rótulo de variante deve ser texto');for(const key of Object.keys(variant))if(key!=='label'&&!Object.hasOwn(missionSchema.fields,key))throw new Error(`Override não reconhecido: ${key}`);}});
 check(['presentation','visual'],()=>validateVisual(mission.presentation?.visual));
 check(['grid'],()=>{if(mission.grid?.width>12||mission.grid?.height>12)throw new Error('Studio: máximo 12×12 na interface (o motor não foi alterado)');});
 check([],()=>validateMission(mission));check(['robotMemory'],()=>validateMemory(mission.robotMemory));
 for(const [i,entity] of (Array.isArray(mission.entities)?mission.entities:[]).entries()){
  if(!record(entity))continue;
  check(['entities',i,'onEnter'],()=>validateEffects(entity.onEnter,mission.initialVariables??{},0,{count:0},mission.robotMemory??{}));
  check(['entities',i,'interactions'],()=>validateInteractions(entity,mission));check(['entities',i,'properties'],()=>validateProperties(entity.properties,mission.initialVariables??{}));
  for(const [j,interaction] of (Array.isArray(entity.interactions)?entity.interactions:[]).entries())if(record(interaction)&&interaction.when)check(['entities',i,'interactions',j,'when'],()=>validateCondition(interaction.when,mission.initialVariables??{},0,mission.robotMemory??{}));
 }
 for(const [i,barrier] of (Array.isArray(mission.barriers)?mission.barriers:[]).entries())check(['barriers',i,'passableWhen'],()=>validatePassageCondition(barrier.passableWhen,mission.initialVariables??{},barrier));
 check(['commandOptions'],()=>validateCommandOptions(mission));
 if(!errors.length){for(const [i,scenario] of missionVariants(mission).entries()){
  check(mission.variants?['variants',i]:[],()=>validateVisual(scenario.presentation?.visual));
  check(['solution'],()=>validateProgram(mission.solution??[],scenario));
 }}
 if(!mission.solution?.length)warnings.push({path:['solution'],message:'Solução vazia: rascunho estrutural não comprova uma missão pronta para jogar.'});
 if(mission.start?.row===mission.goal?.row&&mission.start?.col===mission.goal?.col)warnings.push({path:['start'],message:'O robô nasce na meta.'});
 if((mission.conditionOptions?.length||(Array.isArray(mission.loopOptions)&&mission.loopOptions.some(o=>o?.kind==='while')))&&!mission.variants)warnings.push({path:['variants'],message:'Sem variantes: revise se a decisão é necessária.'});
 return {valid:!errors.length,errors,warnings};
}
