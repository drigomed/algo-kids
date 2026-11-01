// Duas fixtures técnicas: decisões múltiplas nativas, não conteúdo definitivo.
import {demoMissionsV05} from './demo-missions-v05.js';
const seq=text=>text.split('').map(c=>({type:{A:'move',D:'turnRight',E:'turnLeft'}[c]}));
const colors=[['vermelho','Chave vermelha'],['azul','Chave azul'],['verde','Chave verde']];
const selector={kind:'memoryVariable',name:'corNecessaria'};
const mission22={...structuredClone(demoMissionsV05[1]),id:22,title:'As três chaves — ESCOLHA',
 instructions:'Inspecione a fechadura e use ESCOLHA para seguir apenas o caminho da cor guardada. Depois avance até a saída.',
 hint:'Cada caso guarda seus próprios comandos. A mesma escolha deve funcionar nas três variantes. Sem observar, a memória continua desconhecida.',
 switchOptions:[{id:'chavePelaCor',label:'Escolher conforme a cor guardada',selector,cases:colors.map(([value,label])=>({value,label})),defaultLabel:'Outra cor'}],
 solution:[structuredClone(demoMissionsV05[1].solution[0]),{type:'switch',selector:structuredClone(selector),cases:colors.map(([value])=>({value,body:[{type:'interact',relativeTo:'front',actionId:'take',entityId:`opcao-${value}`}]})),default:[]},...seq('AAA')]
};
const choiceSelector={kind:'worldVariable',name:'modo'};
const equal=(variable,value)=>({type:'stateEquals',variable,value});
const set=(variable,value)=>({type:'set',variable,value});
const choices=[['zero','Ativar caminho zero',equal('modo',0)],['um','Ativar caminho um',equal('modo',1)],['outro','Ativar outro caminho',{type:'numberCompare',left:{kind:'worldVariable',name:'modo'},operator:'gte',right:{kind:'literal',value:2}}]];
const act=id=>({type:'interact',relativeTo:'here',actionId:id,entityId:'controle'});
const corridor=new Set(['4,2','3,2','2,2','2,3','2,4']);
const mission23={
 id:23,title:'Um valor, um caminho',demo:true,
 instructions:'Use ESCOLHA com o valor do mundo. Zero e um têm casos próprios; outro valor conhecido usa OUTRO VALOR. Depois siga à estrela.',
 hint:'Zero é uma informação conhecida. OUTRO VALOR é diferente de uma informação ainda não observada.',
 start:{row:4,col:2,direction:'N'},goal:{row:2,col:4},grid:{width:5,height:5,obstacles:Array.from({length:25},(_,i)=>({row:Math.floor(i/5),col:i%5})).filter(p=>!corridor.has(`${p.row},${p.col}`))},
 initialVariables:{modo:0,carga:1,liberada:false,escolha:''},
 entities:[{id:'controle',row:4,col:2,collectible:false,onEnter:[],interactions:choices.map(([id,,when])=>({id,relativeTo:['here'],once:true,when,effects:[set('liberada',true),set('escolha',id)]}))}],
 barriers:[{id:'passagem',row:3,col:2,properties:{limite:3},failureCode:'capacityExceeded',passableWhen:{type:'all',conditions:[equal('liberada',true),{type:'numberCompare',left:{kind:'worldVariable',name:'carga'},operator:'lte',right:{kind:'barrierProperty',name:'limite'}}]}}],
 commandOptions:choices.map(([id,label])=>({id,label,node:act(id)})),
 switchOptions:[{id:'peloValor',label:'Escolher usando a quantidade do mundo',selector:choiceSelector,cases:[{value:0,label:'ZERO'},{value:1,label:'UM'}],defaultLabel:'OUTRO VALOR'}],
 solution:[{type:'switch',selector:choiceSelector,cases:[{value:0,body:[act('zero')]},{value:1,body:[act('um')]}],default:[act('outro')]},...seq('AADAA')],
 variants:[{id:'zero',label:'Quantidade zero'},{id:'um',label:'Quantidade um',initialVariables:{modo:1,carga:1,liberada:false,escolha:''}},{id:'outro',label:'Outro valor conhecido',initialVariables:{modo:2,carga:1,liberada:false,escolha:''}}],
 presentation:{variables:{modo:'Quantidade do mundo'},stateIndicators:[{variable:'modo',label:'Quantidade do mundo'}],entities:{controle:{label:'Controle de caminhos',glyph:'◎',role:'trigger'}},barriers:{passagem:{label:'Passagem',propertyLabels:{limite:'Limite'}}},failures:{capacityExceeded:'A carga atual é {actual}, mas a passagem permite {limit}. O programa parou.'}}
};
export const demoMissionsV06=[mission22,mission23];
