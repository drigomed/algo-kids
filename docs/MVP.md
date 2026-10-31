# Escopo e aceite — MVP V0.1

## Resultado esperado

Jogo HTML/CSS/JavaScript funcional, apresentável e jogável no navegador, com **programação sequencial** para guiar um robô no tabuleiro. É uma versão de experiência real, não apenas um mockup ou protótipo estático.

## Funcionalidades obrigatórias

1. Tela inicial amigável; seleção de missão e tabuleiro quadrado responsivo.
2. Robô com posição e orientação (N/L/S/O), estrela ou base como destino, paredes/obstáculos.
3. Paleta de três comandos: avançar uma casa, virar à esquerda, virar à direita.
4. Construção de um programa como lista ordenada de comandos. Adicionar, remover, reordenar e limpar; interações acessíveis por toque, sem depender de drag & drop.
5. Botões Executar, Pausar/Continuar, Passo a passo e Reiniciar (separar reiniciar execução de apagar programa).
6. Destaque do comando em execução; animação curta e feedback de colisão, conclusão ou programa encerrado sem alcançar o objetivo.
7. Pelo menos 6 missões manuais, com progressão real: andar em linha reta, virar, contornar obstáculo e combinar mudanças de direção. Mapas testados e com pelo menos uma solução.
8. Um botão de dica não deve revelar a solução completa de imediato; evitar bloqueios frustrantes.
9. Layout mobile-first, cores legíveis, botões grandes, idioma pt-BR. Sem dependência de login, API, banco ou anúncios.
10. Código modular: `engine` puramente determinístico, `missions` separado, `ui` e animação independentes.

## Modelo de dados proposto

- Missão `{id, title, instructions, grid:{width,height,obstacles}, start:{row,col,direction}, goal:{row,col}, maxCommands?}`.
- Programa sequencial `{type: 'move' | 'turnLeft' | 'turnRight' }[]`.
- Estado `{row, col, direction, status, instructionPointer, lastEvent}`.
- API do motor: `validateMission`, `applyCommand`, `simulate` (sem UI); a UI anima os estados/eventos retornados.
- A AST deve poder evoluir para `repeat`, `if`, `switch`, `while` sem acoplar execução ao DOM. Não implementar blocos futuros no MVP.

## Critérios de aceite

- `avançar` desloca uma casa conforme orientação; virar não desloca.
- Nunca sai da grade e nunca atravessa parede; erros explicados em linguagem acessível.
- A execução de um programa é reproduzível a partir do mesmo estado inicial.
- Não há execução de código arbitrário da criança (`eval`, `new Function`, etc.).
- Uma missão apenas é concluída quando o robô realmente chega à condição de vitória.
- Existe teste automatizado de direção/rotação, limites, colisão, vitória e de pelo menos uma solução por missão.
- Projeto executa localmente com instruções claras e tem build para hospedagem estática.
- Não se acessa internet nem se envia dados pessoais da criança durante o jogo.

## Fora do escopo do MVP

- `if/else`, `switch`, `for`, `while` funcionais; serão introduzidos gradualmente nas próximas versões.
- Editor sofisticado com arrastar/soltar; pode ser uma lista com botões de ordenação.
- Contas, sincronização na nuvem, backend, pagamentos, rankings, analytics, áudio obrigatório, mascotes gerados por IA.

## Validação com crianças

Adulto observa se a criança entende a orientação do robô e a ordem dos comandos sem explicações longas; registrar qualitativamente confusões, tempo de atenção e feedback, sem coleta automática.
