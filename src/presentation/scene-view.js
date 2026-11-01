import {escapeHtml as h} from '../html.js';
import {commandReach} from '../commands.js';
import {objectProperties} from '../properties.js';
import {asset} from './asset-registry.js';
import {resolveScene,resultPresentation} from './visual-resolver.js';
export function sprite(image,fallbackGlyph='',fallbackId=image.id,extra='') {
 return `<img class="ak-sprite" src="${h(image.src)}" width="64" height="64" alt="" aria-hidden="true" draggable="false" data-asset="${h(image.id)}" data-fallback="${h(fallbackId)}" ${extra}><span class="ak-glyph" hidden>${h(fallbackGlyph)}</span>`;
}
export function renderResultBanner(state,session) {
 const result=resultPresentation(state,session);
 return result?`<section class="ak-result ak-result-${result.kind}" aria-label="${h(result.title)}">${sprite(result.icon,'',result.icon.id)}<strong>${h(result.title)}</strong></section>`:'';
}
export function renderSceneBoard(mission,state,activeNode=null,{effects=[],mood=null,completed=false,interrupted=false}={}) {
 const scene=resolveScene(mission,state),reach=activeNode?commandReach(state,activeNode):null;
 const failure=state.events.find(event=>['collision','actionFailed'].includes(event.type));
 const failedPosition=failure?.target??scene.barriers.find(b=>b.id===failure?.barrierId)??(mission.entities??[]).find(e=>e.id===failure?.entityId);
 const result=resultPresentation(state,{completed,interrupted});
 const robotMood=mood??result?.mood??'idle';
 return Array.from({length:mission.grid.width*mission.grid.height},(_,i)=>{
  const row=Math.floor(i/mission.grid.width),col=i%mission.grid.width,here=p=>p?.row===row&&p?.col===col;
  const robot=here(state),goal=here(mission.goal),obstacle=mission.grid.obstacles.some(here),inReach=here(reach),failed=here(failedPosition);
  const entities=scene.entities.filter(here),features=scene.features.filter(here),barriers=scene.barriers.filter(here);
  const objects=entities.map(e=>{
   const label=e.visual.label??mission.presentation?.entityLabel??'Objeto',role=['collectible','trigger','delivery'].includes(e.visual.role)?` ${e.visual.role}`:'';
   const active=state.events.some(event=>['interacted','inspected'].includes(event.type)&&event.entityId===e.id)?' interaction-target':'';
   return `<span class="entity${role}${active}" role="img" aria-label="${h(label)}" title="${h(label)}">${sprite(e.asset,e.visual.glyph??mission.presentation?.entityGlyph??'●',e.asset.id)}${e.badge?`<small>${h(e.badge)}</small>`:''}</span>`;
  }).join('');
  const passageImages=barriers.map(b=>{
   const label=`${b.visual.label??'Passagem'}: ${b.open?'livre':'fechada'}`;
   return `<span class="barrier ${b.open?'open':'closed'}" role="img" aria-label="${h(label)}" title="${h(label)}">${sprite(b.asset,b.open?b.visual.openGlyph??'▯':b.visual.closedGlyph??'▥',b.asset.id.replace(/_(open|overload|locked)$/,'_closed'))}<span class="ak-object-label"><small>${b.open?'Livre':'Fechado'}</small>${Object.entries(objectProperties(b,state)).map(([name,value])=>`<small>${h(b.visual.propertyLabels?.[name]??'Informação')}: ${h(value)}</small>`).join('')}</span></span>`;
  }).join('');
  const signs=features.map(feature=>`<span class="cell-feature" role="img" aria-label="${h(feature.label)}" title="${h(feature.label)}">${feature.asset?sprite(feature.asset,feature.glyph,'reactive/sign_red'):h(feature.glyph)}<small>${h(feature.label)}</small></span>`).join('');
  const fx=effects.filter(here).map(effect=>`<span class="ak-fx" aria-hidden="true">${sprite(asset(`fx/${effect.asset}`,'fx/interact-spark'))}</span>`).join('');
  return `<div class="cell ak-cell ${scene.config.boardStyle==='blueprint'?'ak-blueprint':''} ${goal?'goal':''} ${inReach?'command-reach':''} ${failed?'failure-target':''}" data-row="${row}" data-col="${col}" style="--ak-tile:url('${h(scene.terrain(row,col).src)}')">${goal?`<span class="ak-goal ${result?.kind==='success'?'ak-goal-won':''}" role="img" aria-label="Destino">${sprite(scene.goal,'★','goals/star')}<span class="ak-goal-ring"></span></span>`:''}${obstacle?`<span class="ak-obstacle" role="img" aria-label="Obstáculo">${sprite(scene.obstacle,'◆','obstacles/rock')}</span>`:''}${passageImages}${signs}${entities.length>1?`<span class="entity-stack">${objects}</span>`:objects}${failed?'<span class="blocked-marker" aria-label="Tentativa bloqueada">!</span>':''}${robot?`<span class="ak-robot ak-mood-${robotMood}" role="img" aria-label="Robô olhando para ${{n:'norte',e:'leste',s:'sul',w:'oeste'}[scene.robot.direction]}">${sprite(scene.robot,'▲','robots/mk1/n')}</span>`:''}${fx}</div>`;
 }).join('');
}
