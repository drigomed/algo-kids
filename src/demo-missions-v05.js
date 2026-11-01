// Fixtures demonstrativas do mecanismo, não currículo definitivo.
const seq=text=>text.split('').map(letter=>({type:{A:'move',E:'turnLeft',D:'turnRight'}[letter]}));
const world=name=>({kind:'worldVariable',name});
const own=name=>({kind:'barrierProperty',name});
const literal=value=>({kind:'literal',value});
const compare=(left,operator,right)=>({type:'numberCompare',left,operator,right});
const eq=(variable,value)=>({type:'stateEquals',variable,value});
const set=(variable,value)=>({type:'set',variable,value});
const grid=rocks=>({width:5,height:5,obstacles:rocks.map(([row,col])=>({row,col}))});
const routeChoice=compare(world('pacotes'),'gte',literal(2));
const inspectA={type:'inspect',source:{type:'barrierProperty',relativeTo:'front',property:'capacidade',barrierId:'ponte-a'},into:'limiteDaPonte'};
const mission20={
 id:20,title:'Duas pontes, cargas diferentes',demo:true,
 instructions:'Avance até a bifurcação. Ponte A: até 1 pacote. Rota B: reservada a cargas de 2 a 3 pacotes. Escolha para cima ou para baixo e siga à estrela.',
 hint:'Depois do primeiro avanço, use SE carga >= 2: desça para B; SENÃO suba para A. Para inspecionar A, avance até (1,1) e olhe para leste. Inspecionar é opcional; memória não altera a física.',
 start:{row:2,col:0,direction:'L'},goal:{row:2,col:4},grid:grid([[0,0],[0,1],[0,2],[0,3],[0,4],[1,0],[1,4],[2,2],[3,0],[3,4],[4,0],[4,1],[4,2],[4,3],[4,4]]),initialVariables:{pacotes:1},robotMemory:{limiteDaPonte:{type:'number',initial:null}},
 barriers:[{id:'ponte-a',row:1,col:2,properties:{capacidade:1},passableWhen:compare(world('pacotes'),'lte',own('capacidade')),failureCode:'capacityExceeded'},
 {id:'ponte-b',row:3,col:2,properties:{minimo:2,capacidade:3},passableWhen:{type:'all',conditions:[compare(world('pacotes'),'gte',own('minimo')),compare(world('pacotes'),'lte',own('capacidade'))]},failureCode:'routeRestricted'}],
 commandOptions:[{id:'observarPonteA',label:'Inspecionar capacidade da ponte A à frente',node:inspectA}],
 conditionOptions:[{id:'carga',label:'Estou carregando pelo menos 2 pacotes?',condition:routeChoice},{id:'caminho',label:'O caminho à frente está livre?',condition:{type:'pathClear'}}],
 solution:[...seq('A'),{type:'if',condition:routeChoice,then:seq('DAEAAEADA'),else:seq('EADAADAEA')}],
 variants:[{id:'leve',label:'Carga de 1 pacote'},{id:'maior',label:'Carga de 2 pacotes',initialVariables:{pacotes:2}}],
 presentation:{visual:{boardStyle:'blueprint',chapter:'advanced',robotSkin:'mk4',environmentTheme:'factory',goalSkin:'star',obstacleSkin:'crate',barrierDefaults:{assetGroup:'bridge'}},variables:{pacotes:'Pacotes'},memory:{limiteDaPonte:{label:'Capacidade observada'}},stateIndicators:[{variable:'pacotes',label:'Pacotes transportados'}],
 barriers:{'ponte-a':{label:'Ponte A',openGlyph:'═',closedGlyph:'╳',propertyLabels:{capacidade:'Capacidade'}},'ponte-b':{label:'Rota B · 2 a 3 pacotes',openGlyph:'═',closedGlyph:'╳',propertyLabels:{minimo:'Carga mínima',capacidade:'Capacidade'}}},
 failures:{capacityExceeded:'Você está com {actual} pacotes, mas esta ponte suporta {limit}. O caminho falhou.',routeRestricted:'A rota B é reservada a cargas de 2 a 3 pacotes. Sua carga atual é {actual}.'}}
};
const colors=[['vermelho','Vermelha','■','red'],['azul','Azul','◆','neutral'],['verde','Verde','●','green']];
const inspectLock={type:'inspect',source:{type:'entityProperty',relativeTo:'front',property:'cor',entityId:'fechadura'},into:'corNecessaria'};
const take=color=>({type:'interact',relativeTo:'front',actionId:'take',entityId:`opcao-${color}`});
const memoryColor=color=>({type:'memoryEquals',variable:'corNecessaria',value:color});
const choose={type:'if',condition:memoryColor('vermelho'),then:[take('vermelho')],else:[{type:'if',condition:memoryColor('azul'),then:[take('azul')],else:[take('verde')]}]};
const mission21={
 id:21,title:'Observar e escolher um objeto',demo:true,
 instructions:'Inspecione a fechadura, guarde a informação e escolha um dos três objetos. Interagir com o objeto incorreto falha; a porta consulta o estado do mundo.',
 hint:'Os objetos estão na mesma casa. Use a ação que identifica o objeto escolhido. A informação da fechadura pode mudar entre os testes.',
 start:{row:4,col:0,direction:'L'},goal:{row:4,col:3},grid:grid([[3,0],[3,1],[3,2],[3,3],[3,4]]),initialVariables:{cor:'vermelho',liberada:false,escolhida:''},robotMemory:{corNecessaria:{type:'string',initial:null}},
 entities:[{id:'fechadura',row:4,col:1,collectible:false,onEnter:[],properties:{cor:{stateVariable:'cor'}}},...colors.map(([color])=>({id:`opcao-${color}`,row:4,col:1,collectible:false,onEnter:[],properties:{cor:color},interactions:[{id:'take',relativeTo:['front'],once:true,consume:true,when:eq('cor',color),effects:[set('escolhida',color),set('liberada',true)]}]}))],
 barriers:[{id:'passagem',row:4,col:2,passableWhen:eq('liberada',true),failureCode:'locked'}],
 commandOptions:[{id:'observarFechadura',label:'Inspecionar a cor da fechadura à frente',node:inspectLock},...colors.map(([color,label])=>({id:`retirar${color}`,label:`Retirar a chave ${label.toLowerCase()} à frente`,node:take(color)}))],
 conditionOptions:[{id:'corVermelha',label:'A cor observada é vermelha?',condition:memoryColor('vermelho'),values:[{value:'vermelho',label:'Vermelha',question:'A cor observada é vermelha?'}]},
 {id:'corAzul',label:'A cor observada é azul?',condition:memoryColor('azul'),values:[{value:'azul',label:'Azul',question:'A cor observada é azul?'}]}],
 solution:[inspectLock,choose,...seq('AAA')],
 variants:colors.map(([color,label])=>({id:color,label:`Fechadura ${label.toLowerCase()}`,initialVariables:{cor:color,liberada:false,escolhida:''}})),
 presentation:{memory:{corNecessaria:{label:'Cor observada',values:colors.map(([value,label])=>({value,label}))}},
 entities:{fechadura:{label:'Fechadura',glyph:'▥',propertyLabels:{cor:'Cor requerida'}},...Object.fromEntries(colors.map(([color,label,glyph])=>[`opcao-${color}`,{label:`Chave ${label.toLowerCase()}`,glyph,role:'collectible',interactionMessage:`Você retirou a chave ${label.toLowerCase()}!`,failureMessages:{preconditionFailed:'Esse objeto não corresponde à informação observada. O programa parou sem retirar nada.'}}]))},
 barriers:{passagem:{label:'Porta'}},failures:{locked:'A passagem ainda está fechada. Observe e escolha um objeto antes de atravessar.'}}
};
export const demoMissionsV05=[mission20,mission21];
