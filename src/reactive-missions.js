// Aplicações do mecanismo: nomes, desenhos e mensagens pertencem às missões.
const seq = text => text.split('').map(c => ({type:{A:'move',E:'turnLeft',D:'turnRight'}[c]}));
const equals = (variable,value) => ({type:'stateEquals',variable,value});
const choose = (condition,yes,no) => ({type:'if',condition,then:seq(yes),else:seq(no)});
const grid = rocks => ({width:5,height:5,obstacles:rocks.map(([row,col])=>({row,col}))});
const set = (variable,value) => ({type:'set',variable,value});
const entity = (id,row,col,collectible,onEnter) => ({id,row,col,collectible,onEnter});
const boolValues = (positive,negative) => [{value:true,label:'Sim',question:positive},{value:false,label:'Não',question:negative}];
const stateDisplay = (variable,label) => ({variable,label,values:[{value:true,label:'Sim'},{value:false,label:'Não'}]});
const base = (id,title,instructions,hint) => ({id,title,instructions,hint,start:{row:4,col:0,direction:'L'},goal:{row:4,col:3},grid:grid([[3,0],[3,1]])});

const signal = {type:'cellPropertyEquals',relativeTo:'front',property:'signal',value:'green'};
const mission13 = {
  ...base(13,'O semáforo','Olhe o sinal à frente: verde libera o caminho de cima; vermelho pede outro percurso.','A pergunta do SE lê o sinal na casa à frente. O mesmo programa precisa servir para as duas cores.'),
  start:{row:4,col:2,direction:'N'},goal:{row:2,col:4},initialVariables:{signal:'green'},
  grid:{...grid([[4,1],[4,3]]),cells:[{row:3,col:2,properties:{signal:{stateVariable:'signal'}}}]},
  barriers:[{id:'passagem',row:3,col:2,passableWhen:equals('signal','green')}],
  conditionOptions:[{id:'sinal',label:'O sinal à frente está verde?',condition:signal,values:[
    {value:'green',label:'Verde',question:'O sinal à frente está verde?'},
    {value:'red',label:'Vermelho',question:'O sinal à frente está vermelho?'}]}],
  solution:[choose(signal,'AADAA','DAAEAA')],
  variants:[{id:'verde',label:'Sinal verde'},{id:'vermelho',label:'Sinal vermelho',initialVariables:{signal:'red'},grid:{...grid([[4,1]]),cells:[{row:3,col:2,properties:{signal:{stateVariable:'signal'}}}]}}],
  presentation:{
    properties:{signal:{label:'Sinal',values:[{value:'green',label:'Verde',glyph:'●',tone:'green'},{value:'red',label:'Pare',glyph:'■',tone:'red'}]}},
    barriers:{passagem:{label:'Passagem do sinal',openGlyph:'↥',closedGlyph:'▥'}},
    stateIndicators:[{variable:'signal',label:'Sinal',values:[{value:'green',label:'Verde'},{value:'red',label:'Vermelho'}]}]
  }
};
const keyEntity = (row,col) => entity('objeto',row,col,true,[set('temChave',true)]);
const mission14 = {
  ...base(14,'A porta trancada','Avance uma casa. Estou com a chave? Se sim, atravesse a porta; senão, procure a chave pelo desvio.','A chave muda o estado do robô. A porta libera a passagem assim que esse estado muda.'),
  initialVariables:{temChave:false},entities:[keyEntity(4,1)],
  barriers:[{id:'passagem',row:4,col:2,passableWhen:equals('temChave',true)}],
  winCondition:equals('temChave',true),
  conditionOptions:[{id:'chave',label:'Estou com a chave?',condition:equals('temChave',true),values:boolValues('Estou com a chave?','Estou sem a chave?')}],
  solution:[...seq('A'),choose(equals('temChave',true),'AA','EADAADA')],
  variants:[{id:'perto',label:'Chave no primeiro passo'},{id:'desvio',label:'Chave no desvio',grid:grid([[3,0]]),entities:[keyEntity(3,1)]}],
  presentation:{entities:{objeto:{label:'Chave',glyph:'⚿',role:'collectible',messages:{collected:'Você pegou a chave!'}}},barriers:{passagem:{label:'Porta',openGlyph:'▯',closedGlyph:'▥'}},
    stateIndicators:[stateDisplay('temChave','Com a chave')],stateMessages:{temChave:[{value:true,message:'A chave liberou a porta.'}]}}
};
const mission15 = {
  ...base(15,'A ponte misteriosa','Pise na placa. Depois pergunte: a ponte está aberta? Escolha um caminho que combine com a resposta.','Primeiro acontece a ação da placa; depois o SE consulta o estado atualizado da ponte.'),
  initialVariables:{placaAtiva:true,ponteAberta:false},
  entities:[entity('placa',4,1,false,[{when:equals('placaAtiva',true),actions:[set('ponteAberta',true)]}])],
  barriers:[{id:'passagem',row:4,col:2,passableWhen:equals('ponteAberta',true)}],
  grid:{...grid([[3,0],[3,1]]),cells:[{row:4,col:1,properties:{marking:{stateVariable:'placaAtiva'}}}]},
  conditionOptions:[{id:'ponte',label:'A ponte está aberta?',condition:equals('ponteAberta',true),values:boolValues('A ponte está aberta?','A ponte está fechada?')}],
  solution:[...seq('A'),choose(equals('ponteAberta',true),'AA','EADAADA')],
  variants:[{id:'ativa',label:'Placa ligada'},{id:'inativa',label:'Placa desligada',initialVariables:{placaAtiva:false,ponteAberta:false},grid:{...grid([[3,0]]),cells:[{row:4,col:1,properties:{marking:{stateVariable:'placaAtiva'}}}]}}],
  presentation:{entities:{placa:{label:'Placa',glyph:'◎',role:'trigger',messages:{entered:'Você pisou na placa.'},guardMessages:{false:'A placa está desligada; a ponte continua fechada.'}}},barriers:{passagem:{label:'Ponte',openGlyph:'═',closedGlyph:'╳'}},
    properties:{marking:{label:'Placa',values:[{value:true,label:'Ligada',glyph:'+',tone:'green'},{value:false,label:'Desligada',glyph:'−',tone:'red'}]}},
    stateIndicators:[stateDisplay('ponteAberta','Ponte aberta')],stateMessages:{ponteAberta:[{value:true,message:'A placa abriu a ponte!'}]}}
};
const packageEntity = (row,col) => entity('objeto',row,col,true,[set('comPacote',true)]);
const delivery = entity('estacao',4,3,false,[{when:equals('comPacote',true),actions:[set('comPacote',false),set('entregue',true)]}]);
const mission16 = {
  ...base(16,'Entrega especial','Pegue o pacote e leve até a estação da estrela. A entrega só acontece quando você está carregando o pacote.','Depois do primeiro passo, pergunte se já está com o pacote. Na estação, observe o que muda no estado.'),
  initialVariables:{comPacote:false,entregue:false},entities:[packageEntity(4,1),delivery],winCondition:equals('entregue',true),
  conditionOptions:[{id:'carregando',label:'Estou carregando o pacote?',condition:equals('comPacote',true),values:boolValues('Estou carregando o pacote?','Estou sem o pacote?')},
    {id:'entrega',label:'O pacote foi entregue?',condition:equals('entregue',true),values:boolValues('O pacote foi entregue?','Ainda falta entregar o pacote?')}],
  solution:[...seq('A'),choose(equals('comPacote',true),'AA','EADAADA')],
  variants:[{id:'perto',label:'Pacote no primeiro passo'},{id:'desvio',label:'Pacote no desvio',grid:grid([[3,0],[4,2]]),entities:[packageEntity(3,1),delivery]}],
  presentation:{entities:{objeto:{label:'Pacote',glyph:'▣',role:'collectible',messages:{collected:'Pacote recolhido!'}},estacao:{label:'Estação de entrega',glyph:'⌂',role:'delivery',messages:{entered:'Você chegou à estação.'},guardMessages:{false:'Ainda falta buscar o pacote para entregar.'}}},
    stateIndicators:[stateDisplay('comPacote','Carregando pacote'),stateDisplay('entregue','Entrega feita')],stateMessages:{entregue:[{value:true,message:'Entrega feita! O pacote chegou ao destino.'}]}}
};
export const reactiveMissions = [mission13,mission14,mission15,mission16];
