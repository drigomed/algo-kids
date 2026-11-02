# Auditoria curricular V0.9.2

Gerada com código real por node scripts/audit-missions.js. Baseline 05eccf6 antes de qualquer mudança de conteúdo. IDs e campos de cenário abaixo são os reais. Métricas: nós AST/decisões/profundidade (raiz 0)/movimentos estáticos. Instruções são dinâmicas, incluindo checks.

## Antes: 25 missões, 43 cenários

| Missão | Status | Cenários e overrides | Nós presentes | N/D/P/M | Resultado/instruções |
|---|---|---|---|---|---|
| 1 · Olá, estrela! | curriculo | 1 · principal: base | move | 3/0/0/3 | principal: won/3 |
| 2 · Uma nova direção | curriculo | 1 · principal: base | turnLeft, move | 4/0/0/3 | principal: won/4 |
| 3 · A curva do caminho | curriculo | 1 · principal: base | move, turnRight | 6/0/0/5 | principal: won/6 |
| 4 · Pedra no caminho | curriculo | 1 · principal: base | turnLeft, move, turnRight | 9/0/0/6 | principal: won/9 |
| 5 · Entre as rochas | curriculo | 1 · principal: base | move, turnRight, turnLeft | 13/0/0/9 | principal: won/11 |
| 6 · Grande expedição | curriculo | 1 · principal: base | move, turnLeft, turnRight | 11/0/0/8 | principal: won/11 |
| 7 · Tesouros pelo caminho | curriculo | 1 · principal: base | move, coleta | 4/0/0/4 | principal: won/4 |
| 8 · Ainda falta um! | curriculo | 1 · principal: base | move, turnLeft, turnRight, coleta | 7/0/0/4 | principal: won/7 |
| 9 · Qual caminho está livre? | curriculo | 2 · cima: base; direita: grid, entities | if, move, turnRight, turnLeft, coleta | 12/1/1/8 | cima: won/6; direita: won/7 |
| 10 · Já tenho o suficiente? | curriculo | 2 · perto: base; desvio: grid, entities | move, if, turnLeft, turnRight, coleta | 11/1/1/7 | perto: won/4; desvio: won/9 |
| 11 · Uma decisão dentro da outra | curriculo | 3 · direto: base; lateral: grid, entities; direita: grid, entities | if, move, turnRight, turnLeft, coleta | 24/2/2/15 | direto: won/7; lateral: won/14; direita: won/7 |
| 12 · Cada descoberta tem seu valor | curriculo | 2 · duplo: base; simples: grid, entities | move, if, turnLeft, turnRight, coleta | 11/1/1/7 | duplo: won/4; simples: won/9 |
| 13 · O semáforo | curriculo | 2 · verde: base; vermelho: initialVariables, grid | if, move, turnRight, turnLeft, barreira física | 12/1/1/8 | verde: won/6; vermelho: won/7 |
| 14 · A porta trancada | curriculo | 2 · perto: base; desvio: grid, entities | move, if, turnLeft, turnRight, coleta, barreira física | 11/1/1/7 | perto: won/4; desvio: won/9 |
| 15 · A ponte misteriosa | curriculo | 2 · ativa: base; inativa: initialVariables, grid | move, if, turnLeft, turnRight, barreira física | 11/1/1/7 | ativa: won/4; inativa: won/9 |
| 16 · Entrega especial | curriculo | 2 · perto: base; desvio: grid, entities | move, if, turnLeft, turnRight, coleta | 11/1/1/7 | perto: won/4; desvio: won/9 |
| 17 · Qual é a cor? | demo | 2 · vermelha: base; azul: initialVariables, grid | inspect, turnLeft, turnRight, if, move, inspeção autorizada, memória, barreira física | 15/1/1/8 | vermelha: won/9; azul: won/10 |
| 18 · Aperte o botão | demo | 1 · principal: base | interact, move, barreira física, guardas | 5/0/0/4 | principal: won/5 |
| 19 · Retirada e entrega | demo | 1 · principal: base | setMemory, interact, move, memória, guardas | 6/0/0/3 | principal: won/6 |
| 20 · Duas pontes, cargas diferentes | demo | 2 · leve: base; maior: initialVariables | move, if, turnRight, turnLeft, inspeção autorizada, memória, barreira física | 20/1/1/11 | leve: won/11; maior: won/11 |
| 21 · Observar e escolher um objeto | demo | 3 · vermelho: initialVariables; azul: initialVariables; verde: initialVariables | inspect, if, interact, move, inspeção autorizada, memória, barreira física, guardas | 9/2/2/3 | vermelho: won/6; azul: won/7; verde: won/7 |
| 22 · As três chaves — ESCOLHA | demo | 3 · vermelho: initialVariables; azul: initialVariables; verde: initialVariables | inspect, switch, interact, move, inspeção autorizada, memória, barreira física, guardas | 8/1/1/3 | vermelho: won/6; azul: won/6; verde: won/6 |
| 23 · Um valor, um caminho | demo | 3 · zero: base; um: initialVariables; outro: initialVariables | switch, interact, move, turnRight, barreira física, guardas | 9/1/1/4 | zero: won/7; um: won/7; outro: won/7 |
| 24 · Repita quatro vezes | demo | 1 · principal: base | for, move, turnLeft | 4/0/1/2 | principal: won/11 |
| 25 · Enquanto o caminho está livre | demo | 2 · curto: base; longo: grid, goal | while, move, turnLeft | 4/0/1/2 | curto: won/7; longo: won/9 |

## Depois: 33 missões, 71 cenários

| Missão | Status | Cenários e overrides | Nós presentes | N/D/P/M | Resultado/instruções |
|---|---|---|---|---|---|
| 1 · Olá, estrela! | curriculo | 1 · principal: base | move | 3/0/0/3 | principal: won/3 |
| 2 · Uma nova direção | curriculo | 1 · principal: base | turnLeft, move | 4/0/0/3 | principal: won/4 |
| 3 · A curva do caminho | curriculo | 1 · principal: base | move, turnRight | 6/0/0/5 | principal: won/6 |
| 4 · Pedra no caminho | curriculo | 1 · principal: base | turnLeft, move, turnRight | 9/0/0/6 | principal: won/9 |
| 5 · Entre as rochas | curriculo | 1 · principal: base | move, turnRight, turnLeft | 13/0/0/9 | principal: won/11 |
| 6 · Grande expedição | curriculo | 1 · principal: base | move, turnLeft, turnRight | 11/0/0/8 | principal: won/11 |
| 7 · Tesouros pelo caminho | curriculo | 1 · principal: base | move, coleta | 4/0/0/4 | principal: won/4 |
| 8 · Ainda falta um! | curriculo | 1 · principal: base | move, turnLeft, turnRight, coleta | 7/0/0/4 | principal: won/7 |
| 9 · Qual caminho está livre? | curriculo | 2 · cima: base; direita: grid, entities | if, move, turnRight, turnLeft, coleta | 12/1/1/8 | cima: won/6; direita: won/7 |
| 10 · Já tenho o suficiente? | curriculo | 2 · perto: base; desvio: grid, entities | move, if, turnLeft, turnRight, coleta | 11/1/1/7 | perto: won/4; desvio: won/9 |
| 11 · Uma decisão dentro da outra | curriculo | 3 · direto: base; lateral: grid, entities; direita: grid, entities | if, move, turnRight, turnLeft, coleta | 24/2/2/15 | direto: won/7; lateral: won/14; direita: won/7 |
| 12 · Cada descoberta tem seu valor | curriculo | 2 · duplo: base; simples: grid, entities | move, if, turnLeft, turnRight, coleta | 11/1/1/7 | duplo: won/4; simples: won/9 |
| 13 · O semáforo | curriculo | 2 · verde: base; vermelho: initialVariables, grid | if, move, turnRight, turnLeft, barreira física | 12/1/1/8 | verde: won/6; vermelho: won/7 |
| 14 · A porta trancada | curriculo | 2 · perto: base; desvio: grid, entities | move, if, turnLeft, turnRight, coleta, barreira física | 11/1/1/7 | perto: won/4; desvio: won/9 |
| 15 · A ponte misteriosa | curriculo | 2 · ativa: base; inativa: initialVariables, grid | move, if, turnLeft, turnRight, barreira física | 11/1/1/7 | ativa: won/4; inativa: won/9 |
| 16 · Entrega especial | curriculo | 2 · perto: base; desvio: grid, entities | move, if, turnLeft, turnRight, coleta | 11/1/1/7 | perto: won/4; desvio: won/9 |
| 17 · Qual é a cor? | demo | 2 · vermelha: base; azul: initialVariables, grid | inspect, turnLeft, turnRight, if, move, inspeção autorizada, memória, barreira física | 15/1/1/8 | vermelha: won/9; azul: won/10 |
| 18 · Aperte o botão | demo | 1 · principal: base | interact, move, barreira física, guardas | 5/0/0/4 | principal: won/5 |
| 19 · Retirada e entrega | demo | 1 · principal: base | setMemory, interact, move, memória, guardas | 6/0/0/3 | principal: won/6 |
| 20 · Duas pontes, cargas diferentes | demo | 2 · leve: base; maior: initialVariables | move, if, turnRight, turnLeft, barreira física | 20/1/1/11 | leve: won/11; maior: won/11 |
| 21 · Observar e escolher um objeto | demo | 3 · vermelho: initialVariables; azul: initialVariables; verde: initialVariables | move, inspect, turnLeft, turnRight, if, interact, inspeção autorizada, memória, barreira física, guardas | 18/2/2/8 | vermelho: won/15; azul: won/16; verde: won/16 |
| 22 · As três chaves — ESCOLHA | curriculo | 3 · vermelho: initialVariables; azul: initialVariables; verde: initialVariables | move, inspect, turnLeft, turnRight, switch, interact, inspeção autorizada, memória, barreira física, guardas | 17/1/1/8 | vermelho: won/15; azul: won/15; verde: won/15 |
| 23 · Um valor, um caminho | demo | 3 · zero: base; um: initialVariables; outro: initialVariables | switch, interact, move, turnRight, barreira física, guardas | 9/1/1/4 | zero: won/7; um: won/7; outro: won/7 |
| 24 · Repita quatro vezes | demo | 2 · leste: base; norte: start, goal | for, move, turnLeft | 4/0/1/2 | leste: won/11; norte: won/11 |
| 25 · Enquanto o caminho está livre | demo | 2 · curto: base; longo: grid, goal | while, move, turnLeft | 4/0/1/2 | curto: won/7; longo: won/9 |
| 26 · A chave tem cor e forma | demo | 4 · vermelho-redonda: initialVariables; vermelho-quadrada: initialVariables; azul-redonda: initialVariables; azul-quadrada: initialVariables | move, inspect, turnLeft, turnRight, if, interact, inspeção autorizada, memória, barreira física, guardas | 21/3/2/8 | vermelho-redonda: won/17; vermelho-quadrada: won/17; azul-redonda: won/17; azul-quadrada: won/17 |
| 27 · Uma das duas permissões | demo | 4 · permissoes0: initialVariables; permissoes1: initialVariables; permissoes2: initialVariables; permissoes3: initialVariables | if, interact, move, turnLeft, turnRight, barreira física, guardas | 19/2/2/11 | permissoes0: won/11; permissoes1: won/5; permissoes2: won/6; permissoes3: won/5 |
| 28 · Quatro destinos, um identificador | demo | 4 · cenario0: initialVariables; cenario1: initialVariables; cenario2: initialVariables; cenario3: initialVariables | switch, interact, move, barreira física, guardas | 9/1/1/4 | cenario0: won/6; cenario1: won/6; cenario2: won/6; cenario3: won/6 |
| 29 · Duas etiquetas, duas escolhas | demo | 4 · cenario0: initialVariables; cenario1: initialVariables; cenario2: initialVariables; cenario3: initialVariables | switch, interact, move, barreira física, guardas | 11/3/2/4 | cenario0: won/7; cenario1: won/7; cenario2: won/7; cenario3: won/7 |
| 30 · Quantas caixas preciso retirar? | demo | 3 · caixas1: initialVariables; caixas2: initialVariables; caixas3: initialVariables | inspect, for, interact, move, inspeção autorizada, memória, barreira física, guardas | 7/0/1/3 | caixas1: won/8; caixas2: won/11; caixas3: won/14 |
| 31 · Enquanto houver caixas | demo | 4 · caixas0: initialVariables; caixas1: initialVariables; caixas2: initialVariables; caixas3: initialVariables | while, interact, move, barreira física, guardas | 6/0/1/3 | caixas0: won/4; caixas1: won/7; caixas2: won/10; caixas3: won/13 |
| 32 · Inspecionar, registrar, avançar | demo | 2 · horizontal: base; vertical: grid, start, goal, entities | for, move, inspect, interact, inspeção autorizada, memória, guardas | 5/0/1/2 | horizontal: won/14; vertical: won/14 |
| 33 · Descarte eficiente | demo | 2 · caixas1: initialVariables, energy; caixas2: initialVariables, energy | while, interact, move, barreira física, guardas, energia | 6/0/1/3 | caixas1: won/7; caixas2: won/10 |

## Diagnóstico, necessidade e contraprovas por missão

### 01 — Olá, estrela!

Propósito: Sequenciar avanços. Status curriculo. Manter integralmente; definição e traces iguais à baseline.

**Contraprova encontrada**: uma sequência sem controles vence todos os cenários: [{"type":"move"},{"type":"move"},{"type":"move"}]. A estrutura de controle pode ser expandida/omitida neste candidato. Isso NÃO prova que interação, inspeção ou memória sejam dispensáveis: essas ações podem continuar na sequência. Para laços literais finitos, a expansão é esperada; não exigir uma única AST correta.

Omissões de ações na referência (contraprovas restritas, não busca geral): não há ações explícitas para omitir.

Mapa idêntico ao da missão anterior: não. Custos/objetivos, inspeção, barreiras e guardas são auditados separadamente dos nós. 

### 02 — Uma nova direção

Propósito: Mudar direção. Status curriculo. Manter integralmente; definição e traces iguais à baseline.

**Contraprova encontrada**: uma sequência sem controles vence todos os cenários: [{"type":"turnLeft"},{"type":"move"},{"type":"move"},{"type":"move"}]. A estrutura de controle pode ser expandida/omitida neste candidato. Isso NÃO prova que interação, inspeção ou memória sejam dispensáveis: essas ações podem continuar na sequência. Para laços literais finitos, a expansão é esperada; não exigir uma única AST correta.

Omissões de ações na referência (contraprovas restritas, não busca geral): não há ações explícitas para omitir.

Mapa idêntico ao da missão anterior: não. Custos/objetivos, inspeção, barreiras e guardas são auditados separadamente dos nós. 

### 03 — A curva do caminho

Propósito: Sequenciar curvas. Status curriculo. Manter integralmente; definição e traces iguais à baseline.

**Contraprova encontrada**: uma sequência sem controles vence todos os cenários: [{"type":"move"},{"type":"move"},{"type":"turnRight"},{"type":"move"},{"type":"move"},{"type":"move"}]. A estrutura de controle pode ser expandida/omitida neste candidato. Isso NÃO prova que interação, inspeção ou memória sejam dispensáveis: essas ações podem continuar na sequência. Para laços literais finitos, a expansão é esperada; não exigir uma única AST correta.

Omissões de ações na referência (contraprovas restritas, não busca geral): não há ações explícitas para omitir.

Mapa idêntico ao da missão anterior: não. Custos/objetivos, inspeção, barreiras e guardas são auditados separadamente dos nós. 

### 04 — Pedra no caminho

Propósito: Evitar obstáculos. Status curriculo. Manter integralmente; definição e traces iguais à baseline.

**Contraprova encontrada**: uma sequência sem controles vence todos os cenários: [{"type":"turnLeft"},{"type":"move"},{"type":"turnRight"},{"type":"move"},{"type":"move"},{"type":"move"},{"type":"move"},{"type":"turnRight"},{"type":"move"}]. A estrutura de controle pode ser expandida/omitida neste candidato. Isso NÃO prova que interação, inspeção ou memória sejam dispensáveis: essas ações podem continuar na sequência. Para laços literais finitos, a expansão é esperada; não exigir uma única AST correta.

Omissões de ações na referência (contraprovas restritas, não busca geral): não há ações explícitas para omitir.

Mapa idêntico ao da missão anterior: não. Custos/objetivos, inspeção, barreiras e guardas são auditados separadamente dos nós. 

### 05 — Entre as rochas

Propósito: Planejar caminho. Status curriculo. Manter integralmente; definição e traces iguais à baseline.

**Contraprova encontrada**: uma sequência sem controles vence todos os cenários: [{"type":"move"},{"type":"turnRight"},{"type":"move"},{"type":"move"},{"type":"move"},{"type":"turnLeft"},{"type":"move"},{"type":"move"},{"type":"move"},{"type":"turnRight"},{"type":"move"},{"type":"turnLeft"},{"type":"move"}]. A estrutura de controle pode ser expandida/omitida neste candidato. Isso NÃO prova que interação, inspeção ou memória sejam dispensáveis: essas ações podem continuar na sequência. Para laços literais finitos, a expansão é esperada; não exigir uma única AST correta.

Omissões de ações na referência (contraprovas restritas, não busca geral): não há ações explícitas para omitir.

Mapa idêntico ao da missão anterior: não. Custos/objetivos, inspeção, barreiras e guardas são auditados separadamente dos nós. 

### 06 — Grande expedição

Propósito: Consolidar sequência. Status curriculo. Manter integralmente; definição e traces iguais à baseline.

**Contraprova encontrada**: uma sequência sem controles vence todos os cenários: [{"type":"move"},{"type":"move"},{"type":"turnLeft"},{"type":"move"},{"type":"move"},{"type":"turnRight"},{"type":"move"},{"type":"move"},{"type":"turnLeft"},{"type":"move"},{"type":"move"}]. A estrutura de controle pode ser expandida/omitida neste candidato. Isso NÃO prova que interação, inspeção ou memória sejam dispensáveis: essas ações podem continuar na sequência. Para laços literais finitos, a expansão é esperada; não exigir uma única AST correta.

Omissões de ações na referência (contraprovas restritas, não busca geral): não há ações explícitas para omitir.

Mapa idêntico ao da missão anterior: não. Custos/objetivos, inspeção, barreiras e guardas são auditados separadamente dos nós. 

### 07 — Tesouros pelo caminho

Propósito: Coletar automaticamente. Status curriculo. Manter integralmente; definição e traces iguais à baseline.

**Contraprova encontrada**: uma sequência sem controles vence todos os cenários: [{"type":"move"},{"type":"move"},{"type":"move"},{"type":"move"}]. A estrutura de controle pode ser expandida/omitida neste candidato. Isso NÃO prova que interação, inspeção ou memória sejam dispensáveis: essas ações podem continuar na sequência. Para laços literais finitos, a expansão é esperada; não exigir uma única AST correta.

Omissões de ações na referência (contraprovas restritas, não busca geral): não há ações explícitas para omitir.

Mapa idêntico ao da missão anterior: não. Custos/objetivos, inspeção, barreiras e guardas são auditados separadamente dos nós. 

### 08 — Ainda falta um!

Propósito: Coleta e destino compostos. Status curriculo. Manter integralmente; definição e traces iguais à baseline.

**Contraprova encontrada**: uma sequência sem controles vence todos os cenários: [{"type":"move"},{"type":"move"},{"type":"turnLeft"},{"type":"move"},{"type":"turnRight"},{"type":"turnRight"},{"type":"move"}]. A estrutura de controle pode ser expandida/omitida neste candidato. Isso NÃO prova que interação, inspeção ou memória sejam dispensáveis: essas ações podem continuar na sequência. Para laços literais finitos, a expansão é esperada; não exigir uma única AST correta.

Omissões de ações na referência (contraprovas restritas, não busca geral): não há ações explícitas para omitir.

Mapa idêntico ao da missão anterior: não. Custos/objetivos, inspeção, barreiras e guardas são auditados separadamente dos nós. 

### 09 — Qual caminho está livre?

Propósito: Decisão pelo cenário. Status curriculo. Manter; oportunidades pedagógicas ficam em V1.0.

Nenhum dos 2 candidatos sem estruturas, derivados dos ramos da referência, venceu todos os cenários. Isso não é prova exaustiva de necessidade. Os negativos específicos testam autorizações, física e ramos; ações presentes são listadas na matriz.

Omissões de ações na referência (contraprovas restritas, não busca geral): não há ações explícitas para omitir.

Mapa idêntico ao da missão anterior: não. Custos/objetivos, inspeção, barreiras e guardas são auditados separadamente dos nós. 

### 10 — Já tenho o suficiente?

Propósito: Rotas condicionais. Status curriculo. Manter; oportunidades pedagógicas ficam em V1.0.

Nenhum dos 2 candidatos sem estruturas, derivados dos ramos da referência, venceu todos os cenários. Isso não é prova exaustiva de necessidade. Os negativos específicos testam autorizações, física e ramos; ações presentes são listadas na matriz.

Omissões de ações na referência (contraprovas restritas, não busca geral): não há ações explícitas para omitir.

Mapa idêntico ao da missão anterior: não. Custos/objetivos, inspeção, barreiras e guardas são auditados separadamente dos nós. 

### 11 — Uma decisão dentro da outra

Propósito: Decisões aninhadas. Status curriculo. Manter; oportunidades pedagógicas ficam em V1.0.

Nenhum dos 3 candidatos sem estruturas, derivados dos ramos da referência, venceu todos os cenários. Isso não é prova exaustiva de necessidade. Os negativos específicos testam autorizações, física e ramos; ações presentes são listadas na matriz.

Omissões de ações na referência (contraprovas restritas, não busca geral): não há ações explícitas para omitir.

Mapa idêntico ao da missão anterior: não. Custos/objetivos, inspeção, barreiras e guardas são auditados separadamente dos nós. 

### 12 — Cada descoberta tem seu valor

Propósito: Pontos e contadores. Status curriculo. Manter; oportunidades pedagógicas ficam em V1.0.

Nenhum dos 2 candidatos sem estruturas, derivados dos ramos da referência, venceu todos os cenários. Isso não é prova exaustiva de necessidade. Os negativos específicos testam autorizações, física e ramos; ações presentes são listadas na matriz.

Omissões de ações na referência (contraprovas restritas, não busca geral): não há ações explícitas para omitir.

Mapa idêntico ao da missão anterior: não. Custos/objetivos, inspeção, barreiras e guardas são auditados separadamente dos nós. 

### 13 — O semáforo

Propósito: Sensor ambiental. Status curriculo. Manter; oportunidades pedagógicas ficam em V1.0.

Nenhum dos 2 candidatos sem estruturas, derivados dos ramos da referência, venceu todos os cenários. Isso não é prova exaustiva de necessidade. Os negativos específicos testam autorizações, física e ramos; ações presentes são listadas na matriz.

Omissões de ações na referência (contraprovas restritas, não busca geral): não há ações explícitas para omitir.

Mapa idêntico ao da missão anterior: não. Custos/objetivos, inspeção, barreiras e guardas são auditados separadamente dos nós. 

### 14 — A porta trancada

Propósito: Chave e porta. Status curriculo. Manter; oportunidades pedagógicas ficam em V1.0.

Nenhum dos 2 candidatos sem estruturas, derivados dos ramos da referência, venceu todos os cenários. Isso não é prova exaustiva de necessidade. Os negativos específicos testam autorizações, física e ramos; ações presentes são listadas na matriz.

Omissões de ações na referência (contraprovas restritas, não busca geral): não há ações explícitas para omitir.

Mapa idêntico ao da missão anterior: não. Custos/objetivos, inspeção, barreiras e guardas são auditados separadamente dos nós. 

### 15 — A ponte misteriosa

Propósito: Placa e ponte. Status curriculo. Manter; oportunidades pedagógicas ficam em V1.0.

Nenhum dos 2 candidatos sem estruturas, derivados dos ramos da referência, venceu todos os cenários. Isso não é prova exaustiva de necessidade. Os negativos específicos testam autorizações, física e ramos; ações presentes são listadas na matriz.

Omissões de ações na referência (contraprovas restritas, não busca geral): não há ações explícitas para omitir.

Mapa idêntico ao da missão anterior: não. Custos/objetivos, inspeção, barreiras e guardas são auditados separadamente dos nós. 

### 16 — Entrega especial

Propósito: Guarda de entrega. Status curriculo. Manter; oportunidades pedagógicas ficam em V1.0.

Nenhum dos 2 candidatos sem estruturas, derivados dos ramos da referência, venceu todos os cenários. Isso não é prova exaustiva de necessidade. Os negativos específicos testam autorizações, física e ramos; ações presentes são listadas na matriz.

Omissões de ações na referência (contraprovas restritas, não busca geral): não há ações explícitas para omitir.

Mapa idêntico ao da missão anterior: não. Custos/objetivos, inspeção, barreiras e guardas são auditados separadamente dos nós. 

### 17 — Qual é a cor?

Propósito: Inspecionar e memorizar. Status demo. Manter; oportunidades pedagógicas ficam em V1.0.

Nenhum dos 2 candidatos sem estruturas, derivados dos ramos da referência, venceu todos os cenários. Isso não é prova exaustiva de necessidade. Os negativos específicos testam autorizações, física e ramos; ações presentes são listadas na matriz.

Omissões de ações na referência (contraprovas restritas, não busca geral): sem inspect: vermelha:actionFailed/memoryUnknown; azul:actionFailed/memoryUnknown.

Mapa idêntico ao da missão anterior: não. Custos/objetivos, inspeção, barreiras e guardas são auditados separadamente dos nós. 

### 18 — Aperte o botão

Propósito: Interação explícita. Status demo. Manter; oportunidades pedagógicas ficam em V1.0.

**Contraprova encontrada**: uma sequência sem controles vence todos os cenários: [{"type":"interact","relativeTo":"front","actionId":"activate"},{"type":"move"},{"type":"move"},{"type":"move"},{"type":"move"}]. A estrutura de controle pode ser expandida/omitida neste candidato. Isso NÃO prova que interação, inspeção ou memória sejam dispensáveis: essas ações podem continuar na sequência. Para laços literais finitos, a expansão é esperada; não exigir uma única AST correta.

Omissões de ações na referência (contraprovas restritas, não busca geral): sem interact: principal:collision/barrier.

Mapa idêntico ao da missão anterior: não. Custos/objetivos, inspeção, barreiras e guardas são auditados separadamente dos nós. Somente um cenário: a referência demonstra interação, mas não prova generalização; planejar variantes em V1.0.

### 19 — Retirada e entrega

Propósito: Retirada e entrega. Status demo. Manter; oportunidades pedagógicas ficam em V1.0.

**Contraprova encontrada**: uma sequência sem controles vence todos os cenários: [{"type":"setMemory","variable":"confirmar","value":true},{"type":"interact","relativeTo":"front","actionId":"receive"},{"type":"move"},{"type":"move"},{"type":"move"},{"type":"interact","relativeTo":"here","actionId":"deliver"}]. A estrutura de controle pode ser expandida/omitida neste candidato. Isso NÃO prova que interação, inspeção ou memória sejam dispensáveis: essas ações podem continuar na sequência. Para laços literais finitos, a expansão é esperada; não exigir uma única AST correta.

Omissões de ações na referência (contraprovas restritas, não busca geral): sem setMemory: principal:actionFailed/memoryUnknown | sem interact: principal:finished/sem motivo.

Mapa idêntico ao da missão anterior: não. Custos/objetivos, inspeção, barreiras e guardas são auditados separadamente dos nós. Somente um cenário: a referência demonstra interação, mas não prova generalização; planejar variantes em V1.0.

### 20 — Duas pontes, cargas diferentes

Propósito: Restrições de carga. Status demo. Ajustar nesta versão conforme spec; regressões e contraprovas em tests/v092.test.js.

Nenhum dos 2 candidatos sem estruturas, derivados dos ramos da referência, venceu todos os cenários. Isso não é prova exaustiva de necessidade. Os negativos específicos testam autorizações, física e ramos; ações presentes são listadas na matriz.

Omissões de ações na referência (contraprovas restritas, não busca geral): não há ações explícitas para omitir.

Mapa idêntico ao da missão anterior: não. Custos/objetivos, inspeção, barreiras e guardas são auditados separadamente dos nós. 

### 21 — Observar e escolher um objeto

Propósito: Observar antes de escolher. Status demo. Ajustar nesta versão conforme spec; regressões e contraprovas em tests/v092.test.js.

Nenhum dos 3 candidatos sem estruturas, derivados dos ramos da referência, venceu todos os cenários. Isso não é prova exaustiva de necessidade. Os negativos específicos testam autorizações, física e ramos; ações presentes são listadas na matriz.

Omissões de ações na referência (contraprovas restritas, não busca geral): sem inspect: vermelho:actionFailed/memoryUnknown; azul:actionFailed/memoryUnknown; verde:actionFailed/memoryUnknown | sem interact: vermelho:collision/locked; azul:collision/locked; verde:collision/locked.

Mapa idêntico ao da missão anterior: não. Custos/objetivos, inspeção, barreiras e guardas são auditados separadamente dos nós. 

### 22 — As três chaves — ESCOLHA

Propósito: Seleção de três casos. Status curriculo. Ajustar nesta versão conforme spec; regressões e contraprovas em tests/v092.test.js.

Nenhum dos 4 candidatos sem estruturas, derivados dos ramos da referência, venceu todos os cenários. Isso não é prova exaustiva de necessidade. Os negativos específicos testam autorizações, física e ramos; ações presentes são listadas na matriz.

Omissões de ações na referência (contraprovas restritas, não busca geral): sem inspect: vermelho:actionFailed/memoryUnknown; azul:actionFailed/memoryUnknown; verde:actionFailed/memoryUnknown | sem interact: vermelho:collision/locked; azul:collision/locked; verde:collision/locked.

Mapa idêntico ao da missão anterior: sim; auditar redundância antes de futura expansão. Custos/objetivos, inspeção, barreiras e guardas são auditados separadamente dos nós. 

### 23 — Um valor, um caminho

Propósito: Zero e caso padrão. Status demo. Manter; oportunidades pedagógicas ficam em V1.0.

Nenhum dos 3 candidatos sem estruturas, derivados dos ramos da referência, venceu todos os cenários. Isso não é prova exaustiva de necessidade. Os negativos específicos testam autorizações, física e ramos; ações presentes são listadas na matriz.

Omissões de ações na referência (contraprovas restritas, não busca geral): sem interact: zero:collision/capacityExceeded; um:collision/capacityExceeded; outro:collision/capacityExceeded.

Mapa idêntico ao da missão anterior: não. Custos/objetivos, inspeção, barreiras e guardas são auditados separadamente dos nós. 

### 24 — Repita quatro vezes

Propósito: Repetição literal. Status demo. Ajustar nesta versão conforme spec; regressões e contraprovas em tests/v092.test.js.

**Contraprova encontrada**: uma sequência sem controles vence todos os cenários: [{"type":"move"},{"type":"move"},{"type":"move"},{"type":"move"},{"type":"turnLeft"},{"type":"move"}]. A estrutura de controle pode ser expandida/omitida neste candidato. Isso NÃO prova que interação, inspeção ou memória sejam dispensáveis: essas ações podem continuar na sequência. Para laços literais finitos, a expansão é esperada; não exigir uma única AST correta.

Omissões de ações na referência (contraprovas restritas, não busca geral): não há ações explícitas para omitir.

Mapa idêntico ao da missão anterior: não. Custos/objetivos, inspeção, barreiras e guardas são auditados separadamente dos nós. 

### 25 — Enquanto o caminho está livre

Propósito: Reavaliar caminho. Status demo. Manter; oportunidades pedagógicas ficam em V1.0.

Nenhum dos 5 candidatos sem estruturas, derivados dos ramos da referência, venceu todos os cenários. Isso não é prova exaustiva de necessidade. Os negativos específicos testam autorizações, física e ramos; ações presentes são listadas na matriz.

Omissões de ações na referência (contraprovas restritas, não busca geral): não há ações explícitas para omitir.

Mapa idêntico ao da missão anterior: não. Custos/objetivos, inspeção, barreiras e guardas são auditados separadamente dos nós. 

### 26 — A chave tem cor e forma

Propósito: Conjunção por aninhamento. Status demo. Nova demonstração com positivos e negativos em tests/v092.test.js.

Nenhum dos 4 candidatos sem estruturas, derivados dos ramos da referência, venceu todos os cenários. Isso não é prova exaustiva de necessidade. Os negativos específicos testam autorizações, física e ramos; ações presentes são listadas na matriz.

Omissões de ações na referência (contraprovas restritas, não busca geral): sem inspect: vermelho-redonda:actionFailed/memoryUnknown; vermelho-quadrada:actionFailed/memoryUnknown; azul-redonda:actionFailed/memoryUnknown; azul-quadrada:actionFailed/memoryUnknown | sem interact: vermelho-redonda:collision/locked; vermelho-quadrada:collision/locked; azul-redonda:collision/locked; azul-quadrada:collision/locked.

Mapa idêntico ao da missão anterior: não. Custos/objetivos, inspeção, barreiras e guardas são auditados separadamente dos nós. 

### 27 — Uma das duas permissões

Propósito: OU inclusivo por fluxo. Status demo. Nova demonstração com positivos e negativos em tests/v092.test.js.

Nenhum dos 3 candidatos sem estruturas, derivados dos ramos da referência, venceu todos os cenários. Isso não é prova exaustiva de necessidade. Os negativos específicos testam autorizações, física e ramos; ações presentes são listadas na matriz.

Omissões de ações na referência (contraprovas restritas, não busca geral): sem interact: permissoes0:won/sem motivo; permissoes1:collision/locked; permissoes2:collision/locked; permissoes3:collision/locked.

Mapa idêntico ao da missão anterior: não. Custos/objetivos, inspeção, barreiras e guardas são auditados separadamente dos nós. 

### 28 — Quatro destinos, um identificador

Propósito: Seleção de quatro casos. Status demo. Nova demonstração com positivos e negativos em tests/v092.test.js.

Nenhum dos 5 candidatos sem estruturas, derivados dos ramos da referência, venceu todos os cenários. Isso não é prova exaustiva de necessidade. Os negativos específicos testam autorizações, física e ramos; ações presentes são listadas na matriz.

Omissões de ações na referência (contraprovas restritas, não busca geral): sem interact: cenario0:collision/locked; cenario1:collision/locked; cenario2:collision/locked; cenario3:collision/locked.

Mapa idêntico ao da missão anterior: não. Custos/objetivos, inspeção, barreiras e guardas são auditados separadamente dos nós. 

### 29 — Duas etiquetas, duas escolhas

Propósito: Seleção hierárquica. Status demo. Nova demonstração com positivos e negativos em tests/v092.test.js.

Nenhum dos 5 candidatos sem estruturas, derivados dos ramos da referência, venceu todos os cenários. Isso não é prova exaustiva de necessidade. Os negativos específicos testam autorizações, física e ramos; ações presentes são listadas na matriz.

Omissões de ações na referência (contraprovas restritas, não busca geral): sem interact: cenario0:collision/locked; cenario1:collision/locked; cenario2:collision/locked; cenario3:collision/locked.

Mapa idêntico ao da missão anterior: não. Custos/objetivos, inspeção, barreiras e guardas são auditados separadamente dos nós. 

### 30 — Quantas caixas preciso retirar?

Propósito: Repetição de quantidade observada. Status demo. Nova demonstração com positivos e negativos em tests/v092.test.js.

Nenhum dos 5 candidatos sem estruturas, derivados dos ramos da referência, venceu todos os cenários. Isso não é prova exaustiva de necessidade. Os negativos específicos testam autorizações, física e ramos; ações presentes são listadas na matriz.

Omissões de ações na referência (contraprovas restritas, não busca geral): sem inspect: caixas1:actionFailed/memoryUnknown; caixas2:actionFailed/memoryUnknown; caixas3:actionFailed/memoryUnknown | sem interact: caixas1:collision/stackBlocked; caixas2:collision/stackBlocked; caixas3:collision/stackBlocked.

Mapa idêntico ao da missão anterior: não. Custos/objetivos, inspeção, barreiras e guardas são auditados separadamente dos nós. 

### 31 — Enquanto houver caixas

Propósito: Reavaliar pilha sem inspeção. Status demo. Nova demonstração com positivos e negativos em tests/v092.test.js.

Nenhum dos 5 candidatos sem estruturas, derivados dos ramos da referência, venceu todos os cenários. Isso não é prova exaustiva de necessidade. Os negativos específicos testam autorizações, física e ramos; ações presentes são listadas na matriz.

Omissões de ações na referência (contraprovas restritas, não busca geral): sem interact: caixas0:won/sem motivo; caixas1:stalled/noProgress; caixas2:stalled/noProgress; caixas3:stalled/noProgress.

Mapa idêntico ao da missão anterior: sim; auditar redundância antes de futura expansão. Custos/objetivos, inspeção, barreiras e guardas são auditados separadamente dos nós. 

### 32 — Inspecionar, registrar, avançar

Propósito: Corpo composto e estações. Status demo. Nova demonstração com positivos e negativos em tests/v092.test.js.

**Contraprova encontrada**: uma sequência sem controles vence todos os cenários: [{"type":"move"},{"type":"inspect","source":{"type":"entityProperty","relativeTo":"here","property":"marca"},"into":"marcaObservada"},{"type":"interact","relativeTo":"here","actionId":"registrar"},{"type":"move"},{"type":"inspect","source":{"type":"entityProperty","relativeTo":"here","property":"marca"},"into":"marcaObservada"},{"type":"interact","relativeTo":"here","actionId":"registrar"},{"type":"move"},{"type":"inspect","source":{"type":"entityProperty","relativeTo":"here","property":"marca"},"into":"marcaObservada"},{"type":"interact","relativeTo":"here","actionId":"registrar"},{"type":"move"}]. A estrutura de controle pode ser expandida/omitida neste candidato. Isso NÃO prova que interação, inspeção ou memória sejam dispensáveis: essas ações podem continuar na sequência. Para laços literais finitos, a expansão é esperada; não exigir uma única AST correta.

Omissões de ações na referência (contraprovas restritas, não busca geral): sem inspect: horizontal:actionFailed/memoryUnknown; vertical:actionFailed/memoryUnknown | sem interact: horizontal:finished/sem motivo; vertical:finished/sem motivo.

Mapa idêntico ao da missão anterior: não. Custos/objetivos, inspeção, barreiras e guardas são auditados separadamente dos nós. 

### 33 — Descarte eficiente

Propósito: Repetição com orçamento. Status demo. Nova demonstração com positivos e negativos em tests/v092.test.js.

Nenhum dos 5 candidatos sem estruturas, derivados dos ramos da referência, venceu todos os cenários. Isso não é prova exaustiva de necessidade. Os negativos específicos testam autorizações, física e ramos; ações presentes são listadas na matriz.

Omissões de ações na referência (contraprovas restritas, não busca geral): sem interact: caixas1:stalled/noProgress; caixas2:stalled/noProgress.

Mapa idêntico ao da missão anterior: não. Custos/objetivos, inspeção, barreiras e guardas são auditados separadamente dos nós. 

## Evidências e limites

Os candidatos são linearizações da referência, sem SE/ESCOLHA/REPITA/ENQUANTO. Repetições variáveis são sondadas com 0–4; não existe busca geral ou otimização. node scripts/audit-missions.js reproduz a auditoria. tests/v092.test.js verifica contraprovas específicas, acesso físico, ramos e invariantes. A troca de orientação na 24 conserva a AST literal; a 32 tem estações e corpo composto. 30/31 reutilizam intencionalmente o mesmo mundo para contrastar contagem observada e reavaliação. 21/22 compartilham intencionalmente a geometria e diferem no SE vs ESCOLHA. 26 usa essa geometria para isolar cor/forma; 28 e 29 usam corredores em direções distintas e quatro ações diferentes. A geometria igual não implica objetivo idêntico. Energia só na 33 e não demonstra ótimo. Revisão pedagógica humana ainda é necessária.
