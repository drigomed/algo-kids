// Arte vetorial original Algo Kids. Geração local determinística; sem fontes/imagens externas.
import {mkdir,writeFile} from 'node:fs/promises';
import {dirname} from 'node:path';
const C={green:'#4EA98F',edge:'#286B62',visor:'#244C58',light:'#B5F4D0',gold:'#F6C453',red:'#D96559',blue:'#669EC7',white:'#F5FBF5',grey:'#73869A'};
const rect=(x,y,w,h,fill,rx=4,extra='')=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${fill}" ${extra}/>`;
const circle=(x,y,r,fill,extra='')=>`<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}" ${extra}/>`;
const path=(d,fill='none',extra='')=>`<path d="${d}" fill="${fill}" ${extra}/>`;
const line=(d,color,width=2)=>path(d,'none',`stroke="${color}" stroke-width="${width}"`);
const shadow=`<ellipse cx="32" cy="55" rx="23" ry="5" fill="#244C58" opacity=".12" stroke="none"/>`;
const mark=(color,x=32,y=30,size=5)=>color==='red'?rect(x-size,y-size,size*2,size*2,C.white,1,'stroke="none"'):color==='blue'?path(`M${x} ${y-size-1}l${size+1} ${size+1}-${size+1} ${size+1}-${size+1}-${size+1}Z`,C.white,'stroke="none"'):circle(x,y,size,C.white,'stroke="none"');
const colors={red:C.red,blue:C.blue,green:C.green};
const star=path('M32 7l7.5 15.5 17 2.5-12.3 12 2.9 17-15.1-8-15.1 8 2.9-17L7.5 25l17-2.5Z',C.gold,'stroke="#B47E28" stroke-width="2"')+line('M25 23l7-13 6 13','#FFE7A0',3);
const check=line('M20 33l8 8 17-19',C.white,5);
const stop=rect(23,21,6,23,C.white,2,'stroke="none"')+rect(35,21,6,23,C.white,2,'stroke="none"');
const ringArrow=line('M45 24a17 17 0 1 0 1 18',C.visor,4)+path('M38 24h12V12',C.gold,'stroke="#244C58" stroke-width="2"');
const art=new Map();
function add(name,body,size=64){art.set(name,`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}"><g stroke="${C.edge}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${body}</g></svg>\n`);}
for(let level=1;level<=4;level++)for(const direction of ['n','e','s','w']) {
 let body=shadow+rect(7,23,9,25,C.edge,4)+rect(48,23,9,25,C.edge,4)+line('M10 28v14M54 28v14','#73B69F',2);
 if(level>=2)body+=rect(17,17,30,35,'#8ACBB0',8);
 body+=rect(13,11,38,42,C.green,12)+line('M21 16h19','#A9E2BD',3);
 const front={n:'M26 10l6-5 6 5',s:'M26 54l6 5 6-5',e:'M54 26l5 6-5 6',w:'M10 26l-5 6 5 6'}[direction];
 body+=path(front,C.gold,'stroke="#A8772E" stroke-width="2"');
 if(direction==='n'||direction==='s') {
  const y=direction==='n'?17:32;
  body+=rect(18,y,28,16,C.visor,7)+circle(26,y+7,2.7,C.light,'stroke="none"')+circle(38,y+7,2.7,C.light,'stroke="none"')+line(`M29 ${y+12}h6`,'#8ED6BD',1.6);
  body+=rect(24,direction==='n'?38:17,16,8,'#72C3A2',3)+line(`M29 ${direction==='n'?42:21}h6`,C.edge,1.5);
 } else {
  const x=direction==='e'?33:15;
  body+=rect(x,18,16,28,C.visor,7)+circle(x+8,26,2.7,C.light,'stroke="none"')+circle(x+8,38,2.7,C.light,'stroke="none"');
  body+=rect(direction==='e'?19:39,25,6,14,'#72C3A2',2);
 }
 if(level>=2)body+=line('M44 12V9',C.edge,2)+circle(44,8,2.5,C.gold)+rect(22,49,20,6,'#397F73',2)+circle(27,52,1,C.light,'stroke="none"');
 if(level>=3)body+=rect(5,27,9,13,C.blue,3)+line('M8 31h3m-3 4h3',C.white,1.5)+circle(49,16,3,C.light)+rect(38,48,7,5,C.gold,1);
 if(level>=4)body+=line('M17 47v5q15 7 30 0v-5',C.visor,3)+rect(49,31,10,10,'#D6E7DD',3)+circle(54,36,2,C.blue)+circle(20,14,1.5,C.gold,'stroke="none"')+circle(25,14,1.5,C.gold,'stroke="none"');
 add(`robots/mk${level}/${direction}.svg`,body);
}
const themes={grass:['#D5E8BC','#BDDAA5'],trail:['#DFC3A1','#CEAE8B'],yard:['#D7DEDC','#BBCAC6'],factory:['#CDD7D6','#B0C0BD'],parking:['#BDCBCF','#A3B6BB']};
for(const [theme,[base,detail]] of Object.entries(themes))for(const [i,name] of ['a','b','c'].entries()) {
 let body=rect(0,0,64,64,base,0,'stroke="none"');const x=10+i*17,y=14+i*11;
 if(theme==='grass')body+=line(`M${x} ${y+4}l-2-4m2 4 2-3M${55-x} ${56-y}l-2-3m2 3 2-4`,detail,1.8)+circle(48-i*8,18+i*7,1.3,detail,'stroke="none"');
 if(theme==='trail')body+=path(`M${x} ${y}l5-1 2 3-5 2Zm${36-i*5} 22l3-1 2 2-4 1Z`,detail,'stroke="none"')+line(`M${15+i*8} 52h6`,detail,1.3);
 if(theme==='yard')body+=line('M0 63h64M63 0v64',detail,1)+circle(x,y,1.4,detail,'stroke="none"')+line(`M${44-i*6} 45h5`,detail,1);
 if(theme==='factory')body+=line('M1 1h62M1 1v62',detail,1)+rect(x,47-i*8,9,3,'#DFE6DE',1,'stroke="none"')+circle(54,10,1.5,detail,'stroke="none"');
 if(theme==='parking')body+=line(i===0?'M5 18V5h13':i===1?'M46 59h13V46':'M6 54h11', '#E9ECDD',2.5)+circle(x,y,1,detail,'stroke="none"');
 add(`tiles/${theme}/${name}.svg`,body);
}
add('goals/star.svg',shadow+star);
add('goals/beacon.svg',shadow+`<ellipse cx="32" cy="46" rx="22" ry="10" fill="#D5EFE0"/>`+rect(23,18,18,29,'#75B79D',6)+circle(32,21,11,C.gold)+circle(32,21,6,'#FFF0AC','stroke="none"')+line('M32 5v4M12 15l4 2m32-2-4 2',C.gold,3));
add('goals/landing-pad.svg',rect(6,6,52,52,'#8EA5AA',12)+rect(11,11,42,42,'#E1E9DF',9)+circle(32,32,15,'#C1DDCA')+line('M21 31l8 8 15-16',C.edge,4)+path('M8 18V8h10m28 0h10v10M8 46v10h10m28 0h10V46','none','stroke="#F6C453" stroke-width="3"'));
add('obstacles/rock.svg',shadow+path('M9 43l4-22L29 10l20 7 7 23-12 13-23-1Z','#8CABA1')+path('M13 22l17-7 8 17-20 9Z','#B1C6B8','stroke="none"')+path('M38 32l11-12 6 21-13 10Z','#6E8D84','stroke="none"')+line('M18 41l20-9 4 19','#78968C',1.5));
add('obstacles/crate.svg',shadow+rect(9,10,46,44,'#CAA273',6)+rect(14,15,36,34,'#E5C498',3)+line('M16 18l32 28M16 46l32-28','#A9845D',5)+rect(7,47,50,8,'#927B60',2));
add('obstacles/cone.svg',shadow+rect(8,47,48,10,'#947E67',4)+path('M27 9h10l13 40H14Z','#E9A063')+path('M23 22h18l3 9H20Z',C.white,'stroke="none"')+path('M18 37h28l3 9H15Z',C.white,'stroke="none"'));
add('obstacles/bollard.svg',shadow+rect(18,9,28,45,'#78959B',9)+rect(19,19,26,9,C.gold,2)+rect(22,9,20,6,'#B8CFCE',3)+rect(13,49,38,7,C.visor,3));
add('collectibles/crystal.svg',shadow+path('M32 6l16 14 4 22-20 15-20-15 4-22Z','#84BED4')+path('M32 6l6 16-6 35-8-35Z','#D2EFF1','stroke="none"')+line('M16 20l16 2 16-2M12 42l20-20 20 20','#5098AC',1.5));
add('collectibles/battery.svg',shadow+rect(24,7,16,6,C.visor,2)+rect(16,12,32,43,C.green,7)+rect(21,18,22,30,'#C9F0CB',4)+path('M34 21l-9 15h7l-2 10 10-16h-7Z',C.gold));
const gearPoints=Array.from({length:32},(_,i)=>{const r=i%4<2?25:19,a=i*Math.PI/16;return `${(32+Math.cos(a)*r).toFixed(2)},${(32+Math.sin(a)*r).toFixed(2)}`;}).join(' ');
add('collectibles/gear.svg',shadow+`<polygon points="${gearPoints}" fill="#A6BDC0"/>`+circle(32,32,11,'#E7F0E5')+circle(32,32,5,C.visor));
add('collectibles/package.svg',shadow+rect(12,13,40,40,'#D4A576',6)+rect(14,15,36,10,'#E8C69E',3,'stroke="none"')+rect(28,14,8,38,'#F3D594',1)+rect(17,32,17,12,C.white,2)+line('M21 36h8m-8 4h5',C.visor,1.5));
add('collectibles/chip.svg',shadow+line('M7 20h8m-8 12h8m-8 12h8m34-24h8m-8 12h8m-8 12h8M20 7v8m12-8v8m12-8v8M20 49v8m12-8v8m12-8v8',C.gold,3)+rect(14,14,36,36,C.visor,7)+rect(21,21,22,22,C.green,4)+line('M26 32h12m-6-6v12',C.light,2));
for(const on of [false,true]) {
 const suffix=on?'on':'off',light=on?C.light:'#A5B5B2';
 add(`reactive/button_${suffix}.svg`,shadow+rect(10,14,44,40,'#A3B7B4',8)+rect(15,18,34,29,C.visor,7)+circle(32,on?34:30,12,on?C.green:'#D2A16C')+circle(32,on?34:30,7,light,'stroke="none"')+line(on?'M27 34h10':'M32 26v8',C.visor,2));
 add(`reactive/lever_${suffix}.svg`,shadow+rect(13,29,38,25,'#9AAFAD',6)+rect(19,36,26,10,C.visor,4)+line(on?'M32 40l14-24':'M32 40 18 16','#E4C894',7)+circle(on?46:18,16,8,on?C.green:'#D2A16C')+circle(46,46,3,light,'stroke="none"'));
 add(`reactive/plate_${suffix}.svg`,shadow+rect(7,12,50,43,'#809C96',8)+rect(11,on?19:15,42,32,on?'#7CC6A0':'#CFD8BD',6)+circle(32,on?35:31,10,light)+line(on?'M26 35h12m-6-6v12':'M26 31h12',C.edge,2.5));
 add(`reactive/station_${on?'active':'idle'}.svg`,shadow+rect(8,17,48,38,'#9DB6B2',7)+path('M8 18 32 6l24 12Z',C.green)+rect(19,27,26,23,C.visor,4)+rect(23,32,18,6,on?C.light:'#7B969D',2)+line('M22 46h20',C.gold,3)+circle(48,24,3,light,'stroke="none"'));
 add(`reactive/terminal_${on?'active':'idle'}.svg`,shadow+rect(17,45,30,9,'#839E9D',3)+rect(27,35,10,13,C.visor,2)+rect(8,9,48,31,'#8BAAA3',7)+rect(13,14,38,21,C.visor,4)+line(on?'M19 25l6 5 11-10m6 5h3':'M21 25h7m8 0h7',on?C.light:'#93B0B0',3));
}
for(const status of ['open','closed','overload']) {
 const open=status==='open',warning=status==='overload';
 let body=path('M8 14q24 12 48 0v38q-24-12-48 0Z','#B9DBDE','stroke="#85A8AB"');
 body+=rect(7,8,7,48,'#6E9691',3)+rect(50,8,7,48,'#6E9691',3);
 if(open)for(const y of [17,27,37,47])body+=rect(15,y,34,8,'#D9BE8C',2);
 else body+=rect(15,11,34,12,'#D9BE8C',2)+rect(15,41,34,12,'#D9BE8C',2)+line('M20 28l24 9m-24 0 24-9',warning?C.red:'#7B9293',3);
 if(warning)body+=path('M32 18l13 23H19Z',C.gold)+line('M32 25v7m0 4v1',C.visor,2.5);
 add(`reactive/bridge_${status}.svg`,body);
}
for(const status of ['closed','open','locked']) {
 const open=status==='open';let body=shadow+rect(8,7,48,49,'#8DAAA2',7)+rect(14,12,36,41,C.visor,4);
 body+=open?path('M15 13l13 6v35l-13-3Z','#B4D4B7')+line('M35 46l5-6 5 6',C.light,3):rect(17,15,30,37,'#C4D8BC',4)+rect(21,20,22,12,'#A7C4B4',3)+circle(41,38,2,C.gold);
 if(status==='locked')body+=path('M26 35v-5a6 6 0 0 1 12 0v5','none','stroke="#8C6A38" stroke-width="3"')+rect(23,34,18,14,C.gold,3)+circle(32,40,2,C.visor,'stroke="none"');
 add(`reactive/door_${status}.svg`,body);
}
for(const open of [false,true])add(`reactive/gate_${open?'open':'closed'}.svg`,shadow+rect(7,11,10,44,'#9AB6AF',3)+rect(47,11,10,44,'#9AB6AF',3)+line(open?'M16 32l6-20m26 20-6-20':'M17 32h30',C.gold,7)+line(open?'M22 15l-2 6m22-6 2 6':'M23 29l4 6m9-6 4 6',C.visor,3)+circle(12,18,3,open?C.light:C.red,'stroke="none"'));
for(const [i,color] of ['red','yellow','green'].entries()) {
 let body=shadow+rect(27,44,10,12,'#6F8E8F',2)+rect(17,6,30,44,C.visor,10);
 for(let n=0;n<3;n++)body+=circle(32,15+n*13,5.3,n===i?[C.red,C.gold,C.green][n]:'#4B6870','stroke="none"');
 body+=i===0?rect(29,12,6,6,C.white,1,'stroke="none"'):i===1?path('M32 25l4 6h-8Z',C.white,'stroke="none"'):line('M29 41l3-4 3 4',C.white,1.7);
 add(`reactive/traffic_${color}.svg`,body);
}
for(const [color,fill] of Object.entries(colors)) {
 add(`reactive/lock_${color}.svg`,shadow+path('M20 28V18a12 12 0 0 1 24 0v10','none','stroke="#738F8A" stroke-width="7"')+rect(12,25,40,29,fill,7)+mark(color,32,39,6));
 add(`reactive/key_${color}.svg`,shadow+circle(23,22,15,fill)+circle(23,22,7,C.white)+path('M30 31l21 20-5 5-7-7-4 3-5-5 4-4-10-10Z',fill)+mark(color,23,22,3.5));
 add(`reactive/sign_${color}.svg`,shadow+rect(28,38,8,18,'#789991',3)+rect(9,8,46,36,fill,8)+rect(13,12,38,28,'none',5,'stroke="#F5FBF5" stroke-width="1.5"')+mark(color,32,26,8));
}
const symbols={success:check,failure:line('M23 23l18 18m0-18-18 18',C.white,5),incomplete:line('M23 32h18',C.visor,5),stalled:ringArrow+line('M18 45l28-28',C.red,4),interrupted:stop};
for(const [name,symbol] of Object.entries(symbols))add(`ui/${name}.svg`,circle(32,32,26,{success:'#2F9E72',failure:C.red,incomplete:'#F9E6AD',stalled:'#E4CFA7',interrupted:C.grey}[name],'stroke="none"')+symbol);
const rays=Array.from({length:8},(_,i)=>{const a=i*Math.PI/4,x=64+Math.cos(a)*40,y=64+Math.sin(a)*40;return line(`M${x.toFixed(2)} ${y.toFixed(2)}l${(Math.cos(a)*12).toFixed(2)} ${(Math.sin(a)*12).toFixed(2)}`,i%2?C.green:C.gold,4);}).join('');
add('fx/success-burst.svg',rays+`<g transform="translate(32 32)">${circle(32,32,25,'#B5F4D0','opacity=".35" stroke="none"')+check}</g>`,128);
add('fx/failure-impact.svg',path('M64 17l9 22 23-10-9 25 24 10-24 10 9 25-23-10-9 22-10-23-24 11 10-25-23-10 23-10-10-25 24 11Z','#F3C7AC','stroke="#D96559" stroke-width="3"')+line('M64 45v23m0 13v1',C.visor,6),128);
add('fx/collect-pop.svg',circle(64,64,30,'none','stroke="#669EC7" stroke-width="3"')+line('M64 12v15m0 74v15M12 64h15m74 0h15',C.gold,5)+path('M64 39l7 17 18 8-18 7-7 18-8-18-17-7 17-8Z','#CDEEF0'),128);
add('fx/interact-spark.svg',path('M70 15 40 66h23l-6 47 33-58H67Z',C.gold,'stroke="#B68A3F" stroke-width="3"')+line('M21 36l10 7m70 44 8 7m-5-61-9 9',C.green,4),128);
add('fx/stalled-loop.svg',`<g transform="translate(16 16) scale(1.5)">${ringArrow+line('M16 47l31-31',C.red,4)}</g>`,128);
add('fx/stopped-pause.svg',circle(64,64,40,'#DFE8EF','stroke="#73869A" stroke-width="3"')+`<g transform="translate(16 16) scale(1.5)">${rect(23,21,6,23,C.grey,2,'stroke="none"')+rect(35,21,6,23,C.grey,2,'stroke="none"')}</g>`,128);
add('fx/overload-warning.svg',path('M64 16l48 85H16Z','#F9E2A0','stroke="#B8893D" stroke-width="3"')+line('M64 43v24m0 15v2',C.visor,6),128);
for(const [name,svg] of art){const target=`src/assets/${name}`;await mkdir(dirname(target),{recursive:true});await writeFile(target,svg);}
console.log(`Arte original gerada: ${art.size} SVGs.`);
// Galeria estática também é reproduzível e usa os mesmos arquivos físicos.
const card=name=>`<figure><figcaption>${name}</figcaption><div class="swatches"><div class="light"><img src="../src/assets/${name}" width="48" height="48" alt="${name} em 48 pixels"><img src="../src/assets/${name}" width="64" height="64" alt="${name} em 64 pixels"></div><div class="dark"><img src="../src/assets/${name}" width="48" height="48" alt="${name} em fundo escuro, 48 pixels"><img src="../src/assets/${name}" width="64" height="64" alt="${name} em fundo escuro, 64 pixels"></div></div></figure>`;
const headings={tiles:'Terrenos · 15',goals:'Metas · 3',obstacles:'Obstáculos · 4',collectibles:'Coletáveis · 5',reactive:'Objetos reativos · 30',fx:'Reações · 7',ui:'Ícones de resultado · 5'};
const gallery=`<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Algo Kids · Galeria V0.8 · 85 SVGs originais</title><link rel="stylesheet" href="../src/presentation/visual.css"><style>
*{box-sizing:border-box}body{font-family:system-ui,sans-serif;margin:0;background:#f4f7ef;color:#244c58}main{max-width:1200px;margin:auto;padding:24px}h1{font-size:clamp(28px,6vw,42px);letter-spacing:-1.5px}h2{margin-top:36px}p{line-height:1.6;max-width:75ch}a{color:#286b62}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(225px,1fr));gap:12px}.robot-row{display:grid;grid-template-columns:repeat(4,minmax(225px,1fr));gap:12px}.scroll{overflow-x:auto;padding:4px 0 12px}figure{min-width:0;margin:0;background:white;border:1px solid #d7e2d7;border-radius:16px;padding:12px}figcaption{font-size:12px;overflow-wrap:anywhere;font-weight:600;margin-bottom:10px}.swatches>div{display:flex;align-items:center;justify-content:space-evenly;gap:8px;padding:8px;border-radius:10px;min-height:80px}.light{background:#f0f4e9}.dark{background:#24404a;margin-top:5px}.swatches img{display:block;flex:none}.note{border-left:4px solid #4ea98f;padding:8px 16px;background:white}.results{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:10px}.ak-result{margin:0}header{border-bottom:1px solid #cedbcf;padding-bottom:20px}footer{margin:40px 0;font-size:13px;color:#58736b}</style></head><body><main><header><p>ALGO KIDS · BIBLIOTECA VISUAL ORIGINAL · V0.8</p><h1>Um robô. Muitas descobertas.</h1><p>85 ilustrações SVG locais. Em cada cartão: 48×48 e 64×64 pixels, primeiro sobre fundo claro, depois sobre escuro. A galeria serve à revisão humana de legibilidade, coerência e contraste; não comprova qualidade artística por teste automatizado.</p><p><a href="../index.html">Abrir o jogo</a> · Execute <code>npm run dev</code> e abra <code>/docs/V08-GALLERY.html</code>.</p></header><section><h2>O mesmo personagem, quatro evoluções · 16</h2><p>Da esquerda para a direita: MK1 Explorador, MK2 Observador, MK3 Técnico, MK4 Operacional. As quatro vistas são desenhadas separadamente, sem girar a imagem no jogo.</p>${['n','e','s','w'].map(d=>`<h3>${{n:'Norte',e:'Leste',s:'Sul',w:'Oeste'}[d]}</h3><div class="scroll"><div class="robot-row">${[1,2,3,4].map(mk=>card(`robots/mk${mk}/${d}.svg`)).join('')}</div></div>`).join('')}</section>${Object.entries(headings).map(([category,title])=>`<section><h2>${title}</h2><div class="grid">${[...art.keys()].filter(name=>name.startsWith(category+'/')).map(card).join('')}</div></section>`).join('')}<section><h2>Placas de resultado</h2><div class="results">${[['success','success','Missão concluída!'],['variant','success','Esta versão passou!'],['collision','failure','O caminho foi bloqueado'],['actionFailed','failure','Esta ação precisa de um ajuste'],['limit','failure','Foram muitos passos'],['stalled','stalled','Vamos sair da repetição?'],['interrupted','interrupted','Interrompido por você'],['incomplete','incomplete','Ainda falta chegar à meta']].map(([kind,icon,title])=>`<section class="ak-result ak-result-${kind}"><img class="ak-sprite" src="../src/assets/ui/${icon}.svg" width="48" height="48" alt=""><strong>${title}</strong></section>`).join('')}</div></section><footer>Arte vetorial autoral gerada localmente por scripts/generate-art.mjs. Sem fontes, imagens ou serviços externos. Os cenários 17–25 continuam fixtures técnicas. A revisão estética e pedagógica final pertence ao responsável.</footer></main></body></html>`;
await writeFile('docs/V08-GALLERY.html',gallery+'\n');
