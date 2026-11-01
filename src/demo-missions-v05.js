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
 instructions:'Escolha uma rota para a carga atual. A ponte A suporta 1; a ponte B suporta 3. Uma tentativa acima do limite interrompe o programa.',
 hint:'Você pode inspecionar a capacidade. A ponte conserva seu limite mesmo sem inspeção; o SE consulta a carga para escolher o caminho.',
 start:{row:4,col:2,direction:'N'},goal:{row:2,col:4},grid:grid([[4,1],[4,3]]),initialVariables:{pacotes:1},robotMemory:{limiteDaPonte:{type:'number',initial:null}},
 barriers:[{id:'ponte-a',row:3,col:2,properties:{capacidade:1},passableWhen:compare(world('pacotes'),'lte',own('capacidade')),failureCode:'capacityExceeded'},
 {id:'ponte-b',row:4,col:4,properties:{capacidade:3},passableWhen:compare(world('pacotes'),'lte',own('capacidade')),failureCode:'capacityExceeded'}],
 commandOptions:[{id:'observarPonteA',label:'Inspecionar capacidade da ponte A à frente',node:inspectA}],
 conditionOptions:[{id:'carga',label:'Estou carregando pelo menos 2 pacotes?',condition:routeChoice},{id:'caminho',label:'O caminho à frente está livre?',condition:{type:'pathClear'}}],
 solution:[{type:'if',condition:routeChoice,then:seq('DAAEAA'),else:seq('AADAA')}],
 variants:[{id:'leve',label:'Carga de 1 pacote'},{id:'maior',label:'Carga de 2 pacotes',initialVariables:{pacotes:2},grid:grid([[4,1]])}],
 presentation:{variables:{pacotes:'Pacotes'},memory:{limiteDaPonte:{label:'Capacidade observada'}},stateIndicators:[{variable:'pacotes',label:'Pacotes transportados'}],
 barriers:{'ponte-a':{label:'Ponte A',openGlyph:'═',closedGlyph:'╳',propertyLabels:{capacidade:'Capacidade'}},'ponte-b':{label:'Ponte B',openGlyph:'═',closedGlyph:'╳',propertyLabels:{capacidade:'Capacidade'}}},
 failures:{capacityExceeded:'Você está com {actual} pacotes, mas esta ponte suporta {limit}. O caminho falhou.'}}
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
