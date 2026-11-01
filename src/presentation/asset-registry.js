// Whitelist fechada. URLs derivam exclusivamente destes caminhos do repositório.
const categories={
 robots:['mk1','mk2','mk3','mk4'].flatMap(skin=>['n','e','s','w'].map(d=>`${skin}/${d}`)),
 tiles:['grass','trail','yard','factory','parking'].flatMap(theme=>['a','b','c'].map(v=>`${theme}/${v}`)),
 goals:['star','beacon','landing-pad'],obstacles:['rock','crate','cone','bollard'],
 collectibles:['crystal','battery','gear','package','chip'],
 reactive:['button_off','button_on','lever_off','lever_on','plate_off','plate_on','bridge_open','bridge_closed','bridge_overload','door_closed','door_open','door_locked','gate_closed','gate_open','traffic_red','traffic_yellow','traffic_green','station_idle','station_active','lock_red','lock_blue','lock_green','key_red','key_blue','key_green','terminal_idle','terminal_active','sign_red','sign_blue','sign_green'],
 fx:['success-burst','failure-impact','collect-pop','interact-spark','stalled-loop','stopped-pause','overload-warning'],
 ui:['success','failure','incomplete','stalled','interrupted']
};
export const assetRegistry=Object.freeze(Object.fromEntries(Object.entries(categories).flatMap(([category,names])=>names.map(name=>[`${category}/${name}`,`${category}/${name}.svg`]))));
export function asset(id,fallback='obstacles/rock') {
 const key=Object.hasOwn(assetRegistry,id)?id:Object.hasOwn(assetRegistry,fallback)?fallback:'obstacles/rock';
 return {id:key,file:assetRegistry[key],src:new URL(`../assets/${assetRegistry[key]}`,import.meta.url).href};
}
// Um único listener delegado; falha de rede não deixa imagem quebrada na cena.
export function installAssetFallback(root) {
 root.addEventListener?.('error',event=>{
  const image=event.target;if(image?.tagName!=='IMG'||!image.dataset.asset)return;
  const fallback=image.dataset.fallback;
  if(fallback&&Object.hasOwn(assetRegistry,fallback)&&image.dataset.asset!==fallback){image.dataset.asset=fallback;image.src=asset(fallback).src;return;}
  image.hidden=true;const glyph=image.nextElementSibling;if(glyph?.classList.contains('ak-glyph'))glyph.hidden=false;
 },true);
}
