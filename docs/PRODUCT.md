# Visão do produto

## Problema

Jogos comuns de tabuleiro fazem a criança mover um personagem diretamente. Aqui, ela precisa **descrever previamente um procedimento**: montar comandos, executar o procedimento e observar se ele funciona. O erro é uma fonte de aprendizado; o sistema deve ajudar a entender o erro, não apenas marcar a resposta errada.

## Público e experiência

- Principal: criança de 6 anos, com auxílio pontual de um adulto.
- Controles grandes, claros e acessíveis por toque. Pictogramas + rótulos curtos.
- Pouca leitura obrigatória no início; frases curtas e dicas visuais.
- Sessões curtas (missões de poucos minutos), com progresso opcional e sem pressão.
- Evitar competição, anúncios, dark patterns ou mecânicas viciantes.

## Princípios pedagógicos

1. **A intenção precede a execução**: programar, depois executar. Evitar mover manualmente o robô pelo tabuleiro como mecânica principal.
2. **Uma abstração por vez**: não apresentar decisões ou loops antes de dominar sequência.
3. **Variabilidade importa**: um `if` só se torna necessário quando a condição pode mudar entre as execuções. Um caminho fixo pode ser decorado; uma condição variável exige lógica.
4. **Semântica fiel**: `for` tem contador explícito; `while` avalia condição antes de repetir; `if/else` escolhe um ramo; `switch` testa casos definidos e default quando aplicável. Não usar o nome de estruturas para mecânicas diferentes.
5. **Feedback verificável**: exibir o comando atual, posição, direção e motivo de parada. Se a missão tem várias configurações, testar em todas as configurações conhecidas.
6. **Linguagem natural primeiro**: 'Repita 3 vezes', 'Se houver parede à frente', 'Enquanto não encontrar a estrela'. A sintaxe JavaScript real pode aparecer opcionalmente em fases posteriores.

## Domínio do jogo

Tabuleiro retangular pequeno, robô com posição `(linha, coluna)` e orientação cardinal, paredes/obstáculos, objetivo, casas especiais e sensores. Programas estruturados em nós tipados em uma AST, não avaliados com `eval`.

Um comando `avançar` move exatamente uma casa na orientação atual e deve detectar limites e obstáculos. `virarEsquerda` e `virarDireita` alteram a direção sem deslocar. A máquina de execução produz eventos por passo para suportar animação, pausa e depuração.

## Responsabilidades

- **Work/ChatGPT**: organizar requisitos, validar pedagogia, especificar missões, discutir UX e revisar resultados.
- **Codex Cloud**: escrever código, testes e documentação no repositório conectado.
- **Responsável adulto**: validar diversão, legibilidade, dificuldade e segurança antes de liberar novas fases para a criança.
