// Fixtures de contrato, não conteúdo pedagógico definitivo. Motor sem IDs especiais.
const grid=obstacles=>({width:5,height:5,obstacles});
const finish=[{type:'turnLeft'},{type:'move'}];
export const demoMissionsV07=[{
  id:24,title:'Repita quatro vezes',demo:true,
  instructions:'Use REPITA 4 VEZES para avançar. Depois do bloco, vire à esquerda e vá até a estrela.',
  hint:'Coloque um Avançar no CORPO. A curva e o último passo ficam no programa principal.',
  grid:grid([]),start:{row:4,col:0,direction:'L'},goal:{row:3,col:4},
  loopOptions:[{id:'quatro',label:'Repetir 4 vezes',kind:'for',times:4}],
  solution:[{type:'for',times:4,body:[{type:'move'}]},...structuredClone(finish)]
},{
  id:25,title:'Enquanto o caminho está livre',demo:true,
  instructions:'Avance ENQUANTO o caminho estiver livre. Depois vire à esquerda e avance até a estrela. Teste o mesmo programa nos dois corredores.',
  hint:'O ENQUANTO observa o caminho antes de cada avanço. O corredor pode mudar de tamanho.',
  grid:grid([{row:4,col:3}]),start:{row:4,col:0,direction:'L'},goal:{row:3,col:2},
  loopOptions:[{id:'livre',label:'O caminho está livre?',kind:'while',condition:{type:'pathClear'}}],
  solution:[{type:'while',condition:{type:'pathClear'},body:[{type:'move'}]},...structuredClone(finish)],
  variants:[{id:'curto',label:'Corredor curto'},{id:'longo',label:'Corredor longo',grid:grid([{row:4,col:4}]),goal:{row:3,col:3}}]
}];
