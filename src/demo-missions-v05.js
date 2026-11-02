import {lockMissionData,approach,returnToGoal,take,mem} from './lock-mission-data.js';
// Fixtures demonstrativas do mecanismo, não currículo definitivo.
const seq=text=>text.split('').map(letter=>({type:{A:'move',E:'turnLeft',D:'turnRight'}[letter]}));
const world=name=>({kind:'worldVariable',name});
const own=name=>({kind:'barrierProperty',name});
const literal=value=>({kind:'literal',value});
const compare=(left,operator,right)=>({type:'numberCompare',left,operator,right});
const grid=rocks=>({width:5,height:5,obstacles:rocks.map(([row,col])=>({row,col}))});
const routeChoice=compare(world('pacotes'),'gte',literal(2));
const mission20={
 id:20,title:'Duas pontes, cargas diferentes',demo:true,
 instructions:'Avance até a bifurcação. Ponte A: até 1 pacote. Rota B: reservada a cargas de 2 a 3 pacotes. Escolha para cima ou para baixo e siga à estrela.',
 hint:'Depois do primeiro avanço, use SE carga >= 2: desça para B; SENÃO suba para A.',
 start:{row:2,col:0,direction:'L'},goal:{row:2,col:4},grid:grid([[0,0],[0,1],[0,2],[0,3],[0,4],[1,0],[1,4],[2,2],[3,0],[3,4],[4,0],[4,1],[4,2],[4,3],[4,4]]),initialVariables:{pacotes:1},
 barriers:[{id:'ponte-a',row:1,col:2,properties:{capacidade:1},passableWhen:compare(world('pacotes'),'lte',own('capacidade')),failureCode:'capacityExceeded'},
 {id:'ponte-b',row:3,col:2,properties:{minimo:2,capacidade:3},passableWhen:{type:'all',conditions:[compare(world('pacotes'),'gte',own('minimo')),compare(world('pacotes'),'lte',own('capacidade'))]},failureCode:'routeRestricted'}],
 conditionOptions:[{id:'carga',label:'Estou carregando pelo menos 2 pacotes?',condition:routeChoice},{id:'caminho',label:'O caminho à frente está livre?',condition:{type:'pathClear'}}],
 solution:[...seq('A'),{type:'if',condition:routeChoice,then:seq('DAEAAEADA'),else:seq('EADAADAEA')}],
 variants:[{id:'leve',label:'Carga de 1 pacote'},{id:'maior',label:'Carga de 2 pacotes',initialVariables:{pacotes:2}}],
 presentation:{visual:{boardStyle:'blueprint',chapter:'advanced',robotSkin:'mk4',environmentTheme:'factory',goalSkin:'star',obstacleSkin:'crate',barrierDefaults:{assetGroup:'bridge'}},variables:{pacotes:'Pacotes'},stateIndicators:[{variable:'pacotes',label:'Pacotes transportados'}],
 barriers:{'ponte-a':{label:'Ponte A',openGlyph:'═',closedGlyph:'╳',propertyLabels:{capacidade:'Capacidade'}},'ponte-b':{label:'Rota B · 2 a 3 pacotes',openGlyph:'═',closedGlyph:'╳',propertyLabels:{minimo:'Carga mínima',capacidade:'Capacidade'}}},
 failures:{capacityExceeded:'Você está com {actual} pacotes, mas esta ponte suporta {limit}. O caminho falhou.',routeRestricted:'A rota B é reservada a cargas de 2 a 3 pacotes. Sua carga atual é {actual}.'}}
};
const mission21={...lockMissionData(),id:21,title:'Observar e escolher um objeto',demo:true,
 instructions:'Avance até a porta e inspecione a cor da fechadura. Suba até as três chaves, escolha a cor observada e volte para atravessar a porta.',
 hint:'A fechadura só pode ser observada de (2,1), olhando para leste. No alto do corredor, use SE para escolher a chave. Volte pelo mesmo corredor.',
 solution:[...approach(),{type:'if',condition:mem('corNecessaria','vermelho'),then:[take('vermelho')],else:[{type:'if',condition:mem('corNecessaria','azul'),then:[take('azul')],else:[take('verde')]}]},...returnToGoal()]
};
export const demoMissionsV05=[mission20,mission21];
