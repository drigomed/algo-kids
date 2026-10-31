const make = (id,title,instructions,start,goal,obstacles,solution,hint) => ({id,title,instructions,grid:{width:5,height:5,obstacles:obstacles.map(([row,col])=>({row,col}))},start:{row:start[0],col:start[1],direction:start[2]},goal:{row:goal[0],col:goal[1]},solution:solution.split('').map(c=>({type:{A:'move',E:'turnLeft',D:'turnRight'}[c]})),hint});
export const missions = [
make(1,'Olá, estrela!','Leve o robô até a estrela. Um passo de cada vez!',[3,1,'L'],[3,4],[[1,1],[1,2],[1,3]],'AAA','O robô já está olhando para a estrela. Cada Avançar anda uma casa.'),
make(2,'Uma nova direção','A estrela está lá em cima. Como virar para encontrá-la?',[4,2,'L'],[1,2],[[2,0],[2,4]],'EAAA','Virar muda para onde o robô olha. Ele continua na mesma casa.'),
make(3,'A curva do caminho','Siga em frente e descubra a hora de virar.',[4,0,'N'],[2,3],[[1,0],[3,2],[4,2]],'AADAAA','Imagine o caminho em duas partes: primeiro para cima, depois para a direita.'),
make(4,'Pedra no caminho','Tem uma pedra à frente. Vamos encontrar outro caminho?',[3,0,'L'],[3,4],[[3,2],[4,2],[0,1]],'EADAAAADA','Contorne a pedra por cima. Vire antes de chegar nela.'),
make(5,'Entre as rochas','Ajude o robô a explorar um caminho com mais curvas.',[4,0,'N'],[0,4],[[2,0],[2,1],[2,2],[4,2],[1,4]],'ADAAAEAAADAEA','Há uma passagem à direita das três rochas do meio. Observe para onde o robô olha depois de cada curva.'),
make(6,'Grande expedição','Junte tudo que aprendeu e encontre a última estrela!',[4,0,'L'],[0,4],[[3,0],[3,1],[3,3],[3,4],[1,1],[1,2],[1,3]],'AAEAADAAEAA','Comece pela passagem no meio das rochas. Depois, explore o lado de cima.')
];
