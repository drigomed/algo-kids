import {demoMissionsV05} from './demo-missions-v05.js';
import {reactiveMissions} from './reactive-missions.js';
import {demoMissions} from './demo-missions.js';
const make = (id,title,instructions,start,goal,obstacles,solution,hint) => ({id,title,instructions,grid:{width:5,height:5,obstacles:obstacles.map(([row,col])=>({row,col}))},start:{row:start[0],col:start[1],direction:start[2]},goal:{row:goal[0],col:goal[1]},solution:solution.split('').map(c=>({type:{A:'move',E:'turnLeft',D:'turnRight'}[c]})),hint});
export const missions = [
make(1,'Olá, estrela!','Leve o robô até a estrela. Um passo de cada vez!',[3,1,'L'],[3,4],[[1,1],[1,2],[1,3]],'AAA','O robô já está olhando para a estrela. Cada Avançar anda uma casa.'),
make(2,'Uma nova direção','A estrela está lá em cima. Como virar para encontrá-la?',[4,2,'L'],[1,2],[[2,0],[2,4]],'EAAA','Virar muda para onde o robô olha. Ele continua na mesma casa.'),
make(3,'A curva do caminho','Siga em frente e descubra a hora de virar.',[4,0,'N'],[2,3],[[1,0],[3,2],[4,2]],'AADAAA','Imagine o caminho em duas partes: primeiro para cima, depois para a direita.'),
make(4,'Pedra no caminho','Tem uma pedra à frente. Vamos encontrar outro caminho?',[3,0,'L'],[3,4],[[3,2],[4,2],[0,1]],'EADAAAADA','Contorne a pedra por cima. Vire antes de chegar nela.'),
make(5,'Entre as rochas','Ajude o robô a explorar um caminho com mais curvas.',[4,0,'N'],[0,4],[[2,0],[2,1],[2,2],[4,2],[1,4]],'ADAAAEAAADAEA','Há uma passagem à direita das três rochas do meio. Observe para onde o robô olha depois de cada curva.'),
make(6,'Grande expedição','Junte tudo que aprendeu e encontre a última estrela!',[4,0,'L'],[0,4],[[3,0],[3,1],[3,3],[3,4],[1,1],[1,2],[1,3]],'AAEAADAAEAA','Comece pela passagem no meio das rochas. Depois, explore o lado de cima.')
];

// As entidades definem efeitos; sua aparência fica apenas em presentation.
const sequence = text => text.split('').map(c => ({type: {A:'move', E:'turnLeft', D:'turnRight'}[c]}));
const branch = (condition, then, otherwise) => ({type: 'if', condition, then, else: otherwise});
const atLeast = (variable, value) => ({type: 'stateAtLeast', variable, value});
const free = {type: 'pathClear'};
const grid = rocks => ({width: 5, height: 5, obstacles: rocks.map(([row,col]) => ({row,col}))});
const item = (id, row, col, variable = 'finds', amount = 1) => ({id, row, col, collectible: true, onEnter: [{type:'increment', variable, amount}]});
function collecting(id, title, instructions, start, goal, rocks, entities, solution, required, hint, variable = 'finds') {
  return {
    id, title, instructions, start: {row:start[0], col:start[1], direction:start[2]}, goal: {row:goal[0], col:goal[1]},
    grid: grid(rocks), initialVariables: {[variable]: 0}, entities, solution,
    winCondition: {type:'all', conditions:[{type:'atGoal'}, atLeast(variable, required)]},
    presentation: {entityGlyph:'●', entityLabel:'Cristal', variables:{[variable]: variable === 'points' ? 'Pontos' : 'Cristais'}, progress:{variable, target:required}},
    hint
  };
}
missions.push(
  collecting(7, 'Tesouros pelo caminho', 'Recolha os dois cristais e chegue à estrela.', [3,0,'L'], [3,4], [[1,1],[1,3]],
    [item('cristal-1',3,1), item('cristal-2',3,3)], sequence('AAAA'), 2,
    'O robô recolhe um cristal ao entrar na casa. Acompanhe o contador!'),
  collecting(8, 'Ainda falta um!', 'Pegue dois cristais. Pode passar pela estrela e voltar depois!', [4,0,'L'], [4,2], [[3,0],[2,1],[2,3]],
    [item('cristal-1',4,1), item('cristal-2',3,2)], sequence('AAEADDA'), 2,
    'Se faltar um cristal, a estrela espera. Procure o cristal acima dela e depois volte.')
);
const mission9 = collecting(9, 'Qual caminho está livre?', 'SE o caminho estiver livre, siga por cima. SENÃO, explore pela direita.', [4,2,'N'], [2,4], [[4,1],[4,3]],
  [item('cristal-1',3,2)], [branch(free, sequence('AADAA'), sequence('DAAEAA'))], 1,
  'Monte um SE com dois caminhos. Depois do treino, uma rocha muda de lugar!');
mission9.variants = [
  {id:'cima', label:'Caminho por cima'},
  {id:'direita', label:'Caminho pela direita', grid:grid([[4,1],[3,2]]), entities:[item('cristal-1',4,3)]}
];
const mission10 = collecting(10, 'Já tenho o suficiente?', 'Ande uma casa. SE já tiver um cristal, siga até a estrela. SENÃO, busque mais acima.', [4,0,'L'], [4,3], [[3,0],[3,1]],
  [item('cristal-1',4,1)], [...sequence('A'), branch(atLeast('finds',1), sequence('AA'), sequence('EADAADA'))], 1,
  'O SE olha o contador na hora de executar, depois do primeiro passo. O cristal pode mudar de casa.');
mission10.variants = [
  {id:'perto', label:'Cristal no primeiro passo'},
  {id:'desvio', label:'Cristal no desvio', grid:grid([[3,0],[4,2]]), entities:[item('cristal-1',3,1)]}
];
const mission11 = collecting(11, 'Uma decisão dentro da outra', 'Observe o caminho. Depois, consulte o contador para escolher o próximo trecho.', [4,2,'N'], [2,4], [[4,1],[4,3],[3,1]],
  [item('cristal-1',3,2)], [branch(free,
    [...sequence('A'), branch(atLeast('finds',1), sequence('ADAA'), sequence('EADAADAAADA'))],
    sequence('DAAEAA'))], 1,
  'Você pode colocar outro SE dentro de ENTÃO. Cada decisão consulta a posição e o contador daquele momento.');
mission11.variants = [
  {id:'direto', label:'Cristal no caminho de cima'},
  {id:'lateral', label:'Cristal na passagem lateral', grid:grid([[4,1],[4,3],[2,2]]), entities:[item('cristal-1',3,1)]},
  {id:'direita', label:'Passagem pela direita', grid:grid([[4,1],[3,2]]), entities:[item('cristal-1',4,3)]}
];
const mission12 = collecting(12, 'Cada descoberta tem seu valor', 'Junte 2 pontos e chegue à estrela. Um cristal pode valer 1 ou 2 pontos!', [4,0,'L'], [4,3], [[3,0],[3,1]],
  [item('cristal-1',4,1,'points',2)], [...sequence('A'), branch(atLeast('points',2), sequence('AA'), sequence('EADAADA'))], 2,
  'Consulte os pontos, não só o número de objetos. Se tiver menos de 2, procure outro cristal no desvio.', 'points');
mission12.variants = [
  {id:'duplo', label:'Primeiro cristal vale 2'},
  {id:'simples', label:'Dois cristais de valor 1', grid:grid([[3,0],[4,2]]), entities:[item('cristal-1',4,1,'points',1), item('cristal-2',3,1,'points',1)]}
];
missions.push(mission9, mission10, mission11, mission12);
export function missionVariants(mission) {
  const {variants, ...base} = mission;
  return (variants ?? [{id:'principal', label:'Cenário principal'}]).map(variant => ({...base, ...structuredClone(variant), id:mission.id??variant.id, variantId:variant.id, variantLabel:variant.label??'Outro cenário'}));
}

missions.push(...reactiveMissions);
missions.push(...demoMissions);

missions.push(...demoMissionsV05);
