# Primeira tarefa para o Codex Cloud

Implemente o **MVP V0.1** do jogo "Missões do Robô — Pequenos Programadores" neste repositório.

Leia primeiro `AGENTS.md`, `README.md` e os documentos em `docs/`.

Requisitos prioritários:
- App realmente jogável em navegador, em pt-BR, responsivo para celular/tablet/desktop.
- HTML/CSS/JavaScript ES modules; sem React e sem backend. Use dependências de desenvolvimento leves apenas se justificadas por testes/build.
- Motor determinístico separado do DOM: grade, direção, avanço, rotação, limites, colisão, vitória, estado e execução passo a passo.
- Editor de programa visual acessível por toque: adicionar `Avançar`, `Virar à esquerda`, `Virar à direita`, remover, reordenar, limpar. A criança prepara comandos e só então executa.
- Controles Executar, Pausar/Continuar, Passo a passo e Reiniciar execução. Mostrar comando ativo durante execução.
- Pelo menos 6 missões com progressão de dificuldade, mapas válidos e soluções verificadas por teste.
- Feedback claro e gentil em erro e sucesso, sem despejar mensagens técnicas.
- Testes automatizados do motor e de soluções por missão; README com instruções de execução e build.
- Não implementar `if`, `switch`, `for` ou `while` ainda, mas preparar arquitetura para comandos compostos no futuro.

Critérios de qualidade:
- Código modular, sem `eval`.
- Nada de login, telemetria, API externa, imagens protegidas ou dependências pagas.
- Visual caprichado e adequado para crianças, mas legível e não poluído.
- Proponha uma estrutura pequena de diretórios, implemente e rode os testes/build.
- Entregue resumo dos arquivos, capturas de tela se disponíveis, instruções para executar e lista de pontos pendentes.

Não faça deploy público nem publique repositório sem aprovação. Trabalhe em branch própria e apresente alterações para revisão.
