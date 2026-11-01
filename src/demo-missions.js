// Cenários de validação do mecanismo. Não representam conteúdo pedagógico definitivo.
const seq=text=>text.split('').map(letter=>({type:{A:'move',E:'turnLeft',D:'turnRight'}[letter]}));
const eq=(variable,value)=>({type:'stateEquals',variable,value});
const mem=(variable,value)=>({type:'memoryEquals',variable,value});
const set=(variable,value)=>({type:'set',variable,value});
const inspect={type:'inspect',source:{type:'cellProperty',relativeTo:'front',property:'mark'},into:'corObservada'};
const interaction=(relativeTo,actionId)=>({type:'interact',relativeTo,actionId});
const grid=rocks=>({width:5,height:5,obstacles:rocks.map(([row,col])=>({row,col}))});
const mission17={
 id:17,title:'Qual é a cor?',demo:true,instructions:'Observe a placa com Inspecionar. Depois escolha o caminho usando a cor que ficou na memória.',hint:'A pergunta usa o que foi guardado, não uma nova leitura do mundo. Antes de decidir, inspecione a casa à frente.',
 start:{row:4,col:2,direction:'N'},goal:{row:2,col:4},initialVariables:{cor:'vermelho'},robotMemory:{corObservada:{type:'string',initial:null}},
 grid:{...grid([[4,1],[4,3]]),cells:[{row:3,col:2,properties:{mark:{stateVariable:'cor'}}}]},
 barriers:[{id:'passagem',row:3,col:2,passableWhen:eq('cor','vermelho')}],
 commandOptions:[{id:'observar',label:'Inspecionar a placa à frente',node:inspect}],
 conditionOptions:[{id:'corGuardada',label:'A cor que guardei é vermelha?',condition:mem('corObservada','vermelho'),values:[{value:'vermelho',label:'Vermelha',question:'A cor que guardei é vermelha?'},{value:'azul',label:'Azul',question:'A cor que guardei é azul?'}]}],
 solution:[inspect,...seq('ED'),{type:'if',condition:mem('corObservada','vermelho'),then:seq('AADAA'),else:seq('DAAEAA')}],
 variants:[{id:'vermelha',label:'Placa vermelha'},{id:'azul',label:'Placa azul',initialVariables:{cor:'azul'},grid:{...grid([[4,1]]),cells:[{row:3,col:2,properties:{mark:{stateVariable:'cor'}}}]}}],
 presentation:{memory:{corObservada:{label:'Cor guardada',values:[{value:'vermelho',label:'Vermelha'},{value:'azul',label:'Azul'}]}},properties:{mark:{label:'Placa',values:[{value:'vermelho',label:'Vermelha',glyph:'■',tone:'red'},{value:'azul',label:'Azul',glyph:'◆',tone:'neutral'}]}},barriers:{passagem:{label:'Passagem'}}}
};
const mission18={
 id:18,title:'Aperte o botão',demo:true,instructions:'Use Interagir diante do botão para abrir a passagem. Depois avance até a estrela.',hint:'Passar pela casa não aperta o botão. O programa precisa dar a ordem de interagir.',
 start:{row:4,col:0,direction:'L'},goal:{row:4,col:4},grid:grid([[3,0],[3,1],[3,2],[3,3],[3,4]]),initialVariables:{disponivel:true,aberta:false},
 entities:[{id:'controle',row:4,col:1,collectible:false,onEnter:[],interactions:[{id:'activate',relativeTo:['front','here'],once:true,when:eq('disponivel',true),effects:[set('aberta',true)]}]}],
 barriers:[{id:'passagem',row:4,col:2,passableWhen:eq('aberta',true)}],
 commandOptions:[{id:'apertar',label:'Interagir com o botão à frente',node:interaction('front','activate')},{id:'apertarAqui',label:'Interagir na casa atual',node:interaction('here','activate')}],
 winCondition:eq('aberta',true),solution:[interaction('front','activate'),...seq('AAAA')],
 presentation:{entities:{controle:{label:'Botão',glyph:'◎',role:'trigger',interactionMessage:'Você apertou o botão!'}},barriers:{passagem:{label:'Passagem'}},stateIndicators:[{variable:'aberta',label:'Passagem aberta',values:[{value:true,label:'Sim'},{value:false,label:'Não'}]}]}
};
const mission19={
 id:19,title:'Retirada e entrega',demo:true,instructions:'Guarde Sim na memória. Interaja para retirar o item e depois interaja na estação para entregá-lo.',hint:'Guardar uma intenção não muda o mundo. Retirar e entregar são duas ações explícitas diferentes.',
 start:{row:4,col:0,direction:'L'},goal:{row:4,col:3},grid:grid([[3,0],[3,1],[3,2],[3,3]]),initialVariables:{carregando:false,entregue:false,confirmar:false},robotMemory:{confirmar:{type:'boolean',initial:null}},
 entities:[{id:'origem',row:4,col:1,collectible:false,onEnter:[],interactions:[{id:'receive',relativeTo:['front'],once:true,consume:true,when:mem('confirmar',true),effects:[set('carregando',true)]}]},{id:'destino',row:4,col:3,collectible:false,onEnter:[],interactions:[{id:'deliver',relativeTo:['here'],once:true,when:eq('carregando',true),effects:[set('carregando',false),set('entregue',true)]}]}],
 commandOptions:[{id:'confirmar',label:'Guardar uma confirmação',node:{type:'setMemory',variable:'confirmar',value:true},values:[{value:true,label:'Sim'},{value:false,label:'Não'}]},{id:'retirar',label:'Interagir para retirar à frente',node:interaction('front','receive')},{id:'entregar',label:'Interagir para entregar aqui',node:interaction('here','deliver')}],
 conditionOptions:[{id:'confirmado',label:'Guardei uma confirmação?',condition:mem('confirmar',true),values:[{value:true,label:'Sim',question:'Guardei uma confirmação?'},{value:false,label:'Não',question:'Guardei Não como resposta?'}]}],
 winCondition:eq('entregue',true),solution:[{type:'setMemory',variable:'confirmar',value:true},interaction('front','receive'),...seq('AAA'),interaction('here','deliver')],
 presentation:{memory:{confirmar:{label:'Confirmação',values:[{value:true,label:'Sim'},{value:false,label:'Não'}]}},entities:{origem:{label:'Retirada',glyph:'▣',role:'collectible',interactionMessage:'Item retirado!'},destino:{label:'Estação de entrega',glyph:'⌂',role:'delivery',interactionMessage:'Entrega concluída!'}},stateIndicators:[{variable:'carregando',label:'Carregando',values:[{value:true,label:'Sim'},{value:false,label:'Não'}]},{variable:'entregue',label:'Entregue',values:[{value:true,label:'Sim'},{value:false,label:'Não'}]}]}
};
export const demoMissions=[mission17,mission18,mission19];
