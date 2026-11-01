# Roadmap orientado por missões

As fases a seguir são incrementais. Só avançar após validar a fase anterior na prática.

## V0.1 — O primeiro algoritmo (sequência)

**Mecânica:** grade 5x5 ou 6x6; robô com direção; comandos `avançar`, `virar à esquerda`, `virar à direita`; programar, executar, pausar e reiniciar; destaque visual do passo. Missões curtas com caminhos variados. Ensinar que a ordem importa.

**Missão exemplo:** 'O robô precisa alcançar a estação de recarga. Programe os passos antes de apertar Executar.'

**Avaliação:** não deve ser possível avançar para fora do tabuleiro; um caminho bloqueado resulta em erro compreensível e possibilidade de corrigir o programa.

## V0.2 — Coleta e decisões (escopo atualizado)

A diretriz atual prioriza entidades genéricas, coleta, estado e `if/else`, com missões 07–12 e variantes determinísticas. Consulte [V02.md](V02.md) para o contrato e os critérios de aceite. As seis missões V0.1 continuam disponíveis.

## V0.3 — O mundo reage ao robô

Sensores ambientais à frente, igualdade estrita de estado, passagens dinâmicas e efeitos condicionais genéricos. Missões 13–16 com variantes determinísticas e perguntas guiadas; contratos e aceite em [V03.md](V03.md). Preserva 01–12, sem implementar repetição ou alterar publicação.

## Futuro — Repetir N vezes (`for`)

**Mecânica:** bloco `Repita N vezes { ... }` com N pequeno e visualização do contador.

**Missão exemplo:** 'A ponte tem sete casas. Você só dispõe de quatro espaços de comandos — invente um jeito de atravessar.' A restrição no tamanho do programa justifica a repetição.

**Avaliação:** distinguir repetição do programa de velocidade de animação; permitir repetição de um bloco de comandos, não só de uma ação.

## Decisões — contempladas na V0.2

**Mecânica:** sensor booleano `caminhoLivreÀFrente`; blocos `Se... Senão...`. Criar cenários variáveis com posições de obstáculos distintas. Mesma solução deve passar nos cenários definidos.

**Missão exemplo:** 'O túnel tem uma porta que às vezes está fechada. Se estiver livre, avance; senão, contorne.' O cenário muda entre testes, tornando necessária uma decisão.

**Avaliação:** a missão não pode premiar um programa que só funciona na disposição visual inicial da porta.

## V0.4 — Múltiplos casos (`switch`)

**Mecânica:** sensor `corDoPiso` com alternativas e um caso padrão.

**Missão exemplo:** 'A placa muda de cor: azul vai à estação A; amarelo vai à B; vermelho vai à C.' Um único programa atende às variações.

**Avaliação:** testar cada cor e caso padrão relevante; dar feedback da condição avaliada.

## V0.5 — Enquanto (`while`)

**Mecânica:** `Enquanto condição { ... }`, avaliação a cada iteração e limite global de passos para interromper loops sem progresso.

**Missão exemplo:** 'Siga pelo corredor até o sensor detectar a bandeira; o comprimento muda em cada execução.' Não revelar comprimento antecipadamente.

**Avaliação:** diferenciar claramente `while` de `for`; detectar loop infinito ou ausência de progresso e explicar ao jogador.

## V1.0 — Missões combinadas

Consolidar sequências + `for` + `if/else` + `switch` + `while`; múltiplos objetivos (entregar item, acionar interruptor, coletar energia), sensores, editor de blocos por encaixe, desbloqueio progressivo, múltiplos cenários de validação e compartilhamento opcional de programas por arquivo local, sem dados pessoais.

## Futuro (não prometer no MVP)

- Robô com acessórios, animações, feedback sonoro opcional.
- Editor em blocos aninhados com drag & drop adaptado ao toque.
- Visualização de pseudocódigo ou JavaScript.
- Criador de missões para adultos.
- PWA offline e instalação na tela inicial.
