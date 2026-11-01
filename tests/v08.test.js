import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile,mkdtemp,cp,writeFile,mkdir,symlink,rm,lstat} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {execFileSync} from 'node:child_process';
import {assetRegistry,asset,installAssetFallback} from '../src/presentation/asset-registry.js';
import {themeConfig} from '../src/presentation/theme-config.js';
import {resolveScene,resultPresentation,terrainVariant} from '../src/presentation/visual-resolver.js';
import {createVisualEffects} from '../src/presentation/visual-effects.js';
import {renderResultBanner,renderSceneBoard} from '../src/presentation/scene-view.js';
import {validateSvg,validateAssets} from '../scripts/validate-assets.js';
import {missions,missionVariants} from '../src/missions.js';
import {initialState,simulate,applyCommand,interruptExecution,createExecution,stepExecution} from '../src/engine.js';
const freeze=value=>{if(value&&typeof value==='object'){Object.values(value).forEach(freeze);Object.freeze(value);}return value;};
const mission=id=>missions.find(m=>m.id===id);
const end=(m,p=m.solution)=>simulate(m,p).at(-1);
const text=file=>readFile(new URL('../'+file,import.meta.url),'utf8');

test('catálogo fechado: 85 SVGs reais, distintos, seguros e compactos',async()=>{
 const expected={robots:16,tiles:15,goals:3,obstacles:4,collectibles:5,reactive:30,fx:7,ui:5};
 for(const [group,count] of Object.entries(expected))assert.equal(Object.keys(assetRegistry).filter(key=>key.startsWith(group+'/')).length,count);
 const report=await validateAssets();assert.equal(report.files,85);assert(report.bytes<750*1024);
 const contents=new Set();for(const file of Object.values(assetRegistry)){const svg=await text('src/assets/'+file);assert(validateSvg(svg,file));assert(!contents.has(svg),file);contents.add(svg);}
 for(const direction of ['n','e','s','w'])assert.equal(new Set(await Promise.all([1,2,3,4].map(mk=>text(`src/assets/robots/mk${mk}/${direction}.svg`)))).size,4);
 for(const theme of ['grass','trail','yard','factory','parking'])assert.equal(new Set(await Promise.all(['a','b','c'].map(v=>text(`src/assets/tiles/${theme}/${v}.svg`)))).size,3);
});
for(const payload of [
 '<script>alert(1)</script>','<foreignObject/>','<image href="https://x.invalid/x"/>','<animate attributeName="x"/>','<style>@import "x";</style>',
 '<rect x="0" y="0" width="10" height="10" onload="alert(1)"/>','<path d="M0 0" fill="url(https://x.invalid)"/>','<!DOCTYPE svg>','<a href="javascript:alert(1)"/>',
 '<g style="filter:url(x)"></g>','<use href="#a"/>','<text>fonte</text>'
])test(`SVG rejeita conteúdo ativo/externo: ${payload.slice(0,35)}`,()=>{
 const svg=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">${payload}<circle cx="20" cy="20" r="5" fill="#fff"/><circle cx="40" cy="40" r="5" fill="#fff"/></svg>`;assert.throws(()=>validateSvg(svg));
});
test('SVG rejeita XML malformado, dimensões vazias e escapes',()=>{
 for(const svg of ['<svg/>','<svg viewBox="0 0 64 64"><g></svg>','<?xml version="1.0"?><svg/>','<svg>&#x3c;script</svg>'])assert.throws(()=>validateSvg(svg));
});
for(const [id,skin,theme,goal] of [[1,'mk1','grass','star'],[7,'mk2','trail','star'],[13,'mk3','yard','beacon'],[20,'mk4','factory','landing-pad'],[23,'mk4','parking','landing-pad']])test(`capítulo visual ${id}: quatro direções, tema e meta`,()=>{
 const m=mission(id);for(const [direction,file] of [['N','n'],['L','e'],['S','s'],['O','w']]){const s=freeze({...initialState(m),direction}),scene=resolveScene(m,s);assert.equal(scene.robot.id,`robots/${skin}/${file}`);assert.equal(scene.environment.theme,theme);assert.equal(scene.goal.id,`goals/${goal}`);}
});
test('aparência, capítulo e piso são independentes, com defaults e whitelist',()=>{
 const m=freeze(mission(1)),s=freeze(initialState(m)),before=structuredClone(s),mixed=resolveScene(m,s,{robotSkin:'mk4',environmentTheme:'parking'});assert.equal(mixed.robot.skin,'mk4');assert.equal(mixed.config.chapter,'navigator');assert.equal(mixed.environment.theme,'parking');assert.deepEqual(s,before);
 const n=structuredClone(m);delete n.id;n.presentation={visual:{robotSkin:'mk1',environmentTheme:'factory',goalSkin:'beacon'}};assert.equal(resolveScene(n,s).environment.theme,'factory');
 const bad={robotSkin:'../../x',environmentTheme:'https://x.invalid',goalSkin:'javascript:x',obstacleSkin:'crate" onerror="x'};const safe=resolveScene(n,s,bad);assert.equal(safe.robot.skin,'mk1');assert.equal(safe.environment.theme,'grass');assert.equal(safe.goal.id,'goals/star');
 assert.equal(asset('https://evil.invalid/x','reactive/door_closed').id,'reactive/door_closed');assert.equal(asset('__proto__','bad').id,'obstacles/rock');
});
test('terreno é determinístico por coordenadas/tema e nunca cria obstáculo',()=>{
 for(const theme of ['grass','trail','yard','factory','parking']){const variants=new Set();for(let row=0;row<5;row++)for(let col=0;col<5;col++){const a=terrainVariant(row,col,theme);assert.equal(a,terrainVariant(row,col,theme));variants.add(a);}assert.equal(variants.size,3);}
 const m=mission(1),s=freeze(initialState(m));assert.equal(resolveScene(m,s).entities.length,0);assert.equal(themeConfig(m).obstacleSkin,'rock');assert.equal(m.grid.width,5);
});
test('semáforo consulta propriedades reais e passagem real nas variantes',()=>{
 for(const m of missionVariants(mission(13))){const s=freeze(initialState(m)),scene=resolveScene(m,s);assert.equal(scene.features[0].asset.id,`reactive/traffic_${s.variables.signal}`);assert.equal(scene.barriers[0].open,s.variables.signal==='green');assert.equal(scene.barriers[0].asset.id,s.variables.signal==='green'?'reactive/gate_open':'reactive/gate_closed');}
});
test('porta/chave, placa/ponte, pacote/estação e botão refletem o estado corrente',()=>{
 for(const m of missionVariants(mission(14))){const s=initialState(m),scene=resolveScene(m,s);assert.equal(scene.entities[0].asset.id,'reactive/key_green');assert.equal(scene.barriers[0].asset.id,'reactive/door_closed');assert.equal(resolveScene(m,end(m)).barriers[0].asset.id,'reactive/door_open');}
 for(const m of missionVariants(mission(15))){const scene=resolveScene(m,initialState(m));assert.equal(scene.entities[0].asset.id,`reactive/plate_${m.initialVariables.placaAtiva?'on':'off'}`);assert.equal(scene.barriers[0].asset.id,'reactive/bridge_closed');}
 const delivery=mission(16);assert.equal(resolveScene(delivery,initialState(delivery)).entities[0].asset.id,'collectibles/package');assert.equal(resolveScene(delivery,end(delivery)).entities.find(e=>e.id==='estacao').asset.id,'reactive/station_active');
 const button=mission(18),s=initialState(button);assert.equal(resolveScene(button,s).entities[0].asset.id,'reactive/button_off');assert.equal(resolveScene(button,applyCommand(button,s,button.solution[0])).entities[0].asset.id,'reactive/button_on');
});
test('cores por propriedades, chaves simultâneas e inspeção preservada nas demos 17/21/22',()=>{
 for(const m of missionVariants(mission(17)))assert.equal(resolveScene(m,initialState(m)).features[0].asset.id,m.initialVariables.cor==='vermelho'?'reactive/sign_red':'reactive/sign_blue');
 for(const id of [21,22])for(const m of missionVariants(mission(id))){const scene=resolveScene(m,initialState(m));assert.equal(scene.entities.length,4);assert.equal(scene.entities[0].asset.id,`reactive/lock_${{vermelho:'red',azul:'blue',verde:'green'}[m.initialVariables.cor]}`);assert.deepEqual(scene.entities.slice(1).map(e=>e.asset.id),['reactive/key_red','reactive/key_blue','reactive/key_green']);assert.equal(scene.barriers[0].asset.id,'reactive/door_locked');const html=renderSceneBoard(m,initialState(m));assert.match(html,/entity-stack/);assert.match(html,/Chave vermelha/);}
});
test('sobrecarga exige motivo físico, sem alterar capacidade nem posição',()=>{
 const m=missionVariants(mission(20))[1],s=freeze(initialState(m)),scene=resolveScene(m,s);assert.equal(scene.barriers.find(b=>b.id==='ponte-a').asset.id,'reactive/bridge_overload');assert.equal(scene.barriers.find(b=>b.id==='ponte-b').asset.id,'reactive/bridge_open');
 const failed=applyCommand(m,s,{type:'move'});assert.equal(failed.reason,'capacityExceeded');assert.equal(failed.row,s.row);assert.equal(m.barriers[0].properties.capacidade,1);assert.match(renderSceneBoard(m,failed),/failure-target/);
 const fx=createVisualEffects().next(m,failed);assert(fx.effects.some(e=>e.asset==='overload-warning'&&e.row===3&&e.col===2));
});
test('fallbacks conservadores não usam URLs de entrada nem interpretam efeitos',()=>{
 const m=structuredClone(mission(18));m.presentation.visual={entities:{controle:{assetGroup:'unknown',state:{source:'eval',expression:'alert(1)'}}},barrierDefaults:{assetGroup:'unknown'}};
 const s=freeze(initialState(m)),scene=resolveScene(m,s);assert.equal(scene.entities[0].asset.id,'reactive/terminal_idle');assert.equal(scene.barriers[0].asset.id,'reactive/gate_closed');assert(!renderSceneBoard(m,s).includes('alert(1)'));
 m.presentation.entities.controle.label='<img src=x onerror=x>';assert(!renderSceneBoard(m,s).includes('<img src=x'));
});
test('falha no carregamento troca para fallback existente e finalmente glyph legado',()=>{
 let handler;installAssetFallback({addEventListener(type,callback,capture){assert.equal(type,'error');assert.equal(capture,true);handler=callback;}});
 const glyph={hidden:true,classList:{contains:name=>name==='ak-glyph'}},img={tagName:'IMG',dataset:{asset:'reactive/door_locked',fallback:'reactive/door_closed'},nextElementSibling:glyph,hidden:false};handler({target:img});assert.equal(img.dataset.asset,'reactive/door_closed');assert(img.src.endsWith('/reactive/door_closed.svg'));handler({target:img});assert.equal(img.hidden,true);assert.equal(glyph.hidden,false);
});
for(const status of ['won','collision','actionFailed','limit','stalled','stopped','finished','ready','running'])test(`feedback visual ${status}: símbolo, mensagem e intensidade próprios`,()=>{
 const s={...initialState(mission(1)),status},p=resultPresentation(s,{completed:true});
 if(['ready','running'].includes(status)){assert.equal(p,null);assert.equal(renderResultBanner(s,{}),'');return;}
 assert(p.icon.id.startsWith('ui/'));assert(renderResultBanner(s,{completed:true}).includes(p.title));assert(!renderResultBanner(s,{}).includes('<dialog'));
 if(status==='stopped'){assert.equal(p.kind,'interrupted');assert.equal(p.fx,'stopped-pause');}if(status==='stalled')assert.equal(p.icon.id,'ui/stalled');if(status==='finished')assert.equal(p.fx,null);
});
test('vitória parcial é menor; interrupção entre variantes não dispara celebração',()=>{
 const s=end(mission(1));assert.equal(resultPresentation(s,{completed:false}).kind,'variant');assert.equal(resultPresentation(s,{completed:false}).fx,null);assert.equal(resultPresentation(s,{completed:true}).fx,'success-burst');assert.equal(resultPresentation(s,{interrupted:true}).kind,'interrupted');
});
test('FX deduplicados por execução/cenário/passo e sem confete nas decisões',()=>{
 const m=mission(7),s=applyCommand(m,initialState(m),{type:'move'}),effects=createVisualEffects();const before=freeze(s),first=effects.next(m,before,{context:'a:0'});assert(first.effects.some(e=>e.asset==='collect-pop'));assert.equal(effects.next(m,before,{context:'a:0'}).fresh,false);assert.equal(effects.next(m,structuredClone(before),{context:'a:0'}).effects.length,0);assert(effects.next(m,before,{context:'b:0'}).fresh);
 const decision=mission(9),state=simulate(decision,decision.solution)[1];assert.deepEqual(effects.next(decision,state,{context:'decision'}).effects,[]);
});
test('cenário mantém meta legível sob robô e coleções só somem pelo estado do motor',()=>{
 const m=mission(1),s=end(m),html=renderSceneBoard(m,s,null,{completed:true});assert.match(html,/ak-goal-ring/);assert.match(html,/ak-robot/);assert.match(html,/goals\/star.svg/);
 const collect=mission(7),before=initialState(collect),after=applyCommand(collect,before,{type:'move'});assert.equal(resolveScene(collect,before).entities.length,2);assert.equal(resolveScene(collect,after).entities.length,1);
});
test('galeria lista todos os arquivos nos dois tamanhos, quatro modelos por direção, fundos claro/escuro',async()=>{
 const html=await text('docs/V08-GALLERY.html');for(const file of Object.values(assetRegistry))assert(html.includes(`../src/assets/${file}`));assert.equal((html.match(/<figure>/g)??[]).length,85);assert.equal((html.match(/class="robot-row"/g)??[]).length,4);assert(html.includes('width="48"'));assert(html.includes('width="64"'));assert(html.includes('class="dark"'));assert(!/https?:|<script|cdn/i.test(html));
});
test('movimento reduzido preserva ícones/estados; efeitos não agendam execução',async()=>{
 const css=await text('src/presentation/visual.css'),effects=await text('src/presentation/visual-effects.js');assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);assert.match(css,/animation:none;transition:none/);assert(!/setTimeout|setInterval|stepExecution|applyCommand/.test(effects));
});
test('SVGs publicados são somente catálogo autorizado; artefato rejeita injeções e symlinks',async()=>{
 const temp=await mkdtemp(join(tmpdir(),'algo-v08-'));
 try {
  await cp('src',join(temp,'src'),{recursive:true});await cp('studio',join(temp,'studio'),{recursive:true});await cp('index.html',join(temp,'index.html'));
  const validate=()=>execFileSync(process.execPath,['scripts/validate-dist.js',temp],{stdio:'pipe'});validate();assert.equal((await validateAssets(temp)).files,85);
  for(const name of ['src/bad.svg','src/bad.html','src/assets/bad.svg','src/assets/bad.js']){const path=join(temp,name);await writeFile(path,'<svg/>');assert.throws(validate);await rm(path);}
  const svg=join(temp,'src/assets/ui/success.svg'),original=await readFile(svg);await writeFile(svg,'<svg onload="alert(1)"/>');assert.throws(validate);await writeFile(svg,original);
  const sym=join(temp,'src/assets/ui/linked.svg');await symlink(svg,sym);assert.throws(validate);await rm(sym);
  const source=join(temp,'src/ui.js'),js=await readFile(source,'utf8');await writeFile(source,js+"\nimport '/outside.js';");assert.throws(validate);
 }finally{await rm(temp,{recursive:true,force:true});}
});
test('contratos V0.7.1: definições e traces completos das 25 missões permanecem idênticos',async()=>{
 const {createHash}=await import('node:crypto'),baseline=JSON.parse(await text('tests/fixtures/v071-domain-baseline.json'));
 const digest=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');assert.equal(digest(missions),baseline.missions);
 for(const expected of baseline.variants){const m=mission(expected.missionId),scenario=missionVariants(m).find(s=>s.variantId===expected.variantId),states=simulate(freeze(scenario),freeze(structuredClone(m.solution)));assert.equal(digest(states),expected.trace);assert.equal(states.at(-1).instructionPointer,expected.instructions);assert.equal(states.at(-1).status,expected.status);}
});
test('seletores visuais malformados usam fallback sem ler código ou URLs',()=>{
 const m=structuredClone(mission(18));m.presentation.visual={entities:{controle:{assetGroup:'button',state:{source:'variable',name:'aberta',values:[null,{},'on',{value:false,state:'file://evil'}]}}}};
 assert.equal(resolveScene(m,initialState(m)).entities[0].asset.id,'reactive/button_off');
});
