# Instruções para Codex e agentes de desenvolvimento

Leia `README.md`, `docs/PRODUCT.md`, `docs/ROADMAP.md`, `docs/MVP.md`, `docs/V02.md`, `docs/V03.md`, `docs/V04.md`, `docs/V05.md`, `docs/V06.md`, `docs/V07.md`, `docs/V071.md` e `docs/V08.md` antes de implementar.

## Produto
- Jogo educativo de programação visual para criança de 6 anos, em pt-BR.
- Conceito central: **a criança constrói um algoritmo, depois o robô executa**.
- Preferir UX simples, agradável, visual, responsiva e acessível ao toque.
- Preservar integralmente definições e soluções 01–23, especialmente jogabilidade e comandos infantis 01–06. V0.7 acrescenta for/while nativos autorizados por loopOptions; 24–25 são somente fixtures técnicas. Sem expansão da AST, break/continue ou iterador local.
- V0.7.1 detecta ciclos semânticos por ativação de while (FIFO 256); for finito não estagna. Preservar 01–25. Interromper é terminal sem consumir instrução; pausa só suspende playback. Não reclassificar vitórias anteriores ao cancelar variantes.
- Trocar presets de laço na mesma categoria preserva body; trocar de categoria não é edição silenciosa. Checks consomem orçamento, inclusive saída; while reavalia o estado atual.
- Nunca descartar corpos de casos silenciosamente ao trocar configuração. Validar caminhos cases/body/default e body de for/while, profundidade estrutural e permissões também no motor.
- Motor genérico: ações, condições e regras de passagem não conhecem nomes de objetos. Aparência e mensagens pertencem aos dados das missões.
- Um movimento proibido continua sendo um programa válido: falha em runtime, sem entrar na casa ou aplicar efeitos. Não corrigir a rota nem bloquear a escolha no editor. Física não depende da memória.
- Mundo e memória são namespaces distintos. Comandos e perguntas precisam de autorização declarativa, verificada também no motor. Nenhuma falha de interação pode publicar efeitos parciais.

## V0.8 — Apresentação
- Arte original em src/assets: 85 SVGs versionados. Gerador determinístico local; nada externo.
- Aparência do robô, capítulo e tema são independentes em src/presentation. Não reescrever missões ou inferir regras por imagens/onEnter.
- A arte pode mudar na V0.8, mas mapas, objetivos, soluções, motor e relógio de execução permanecem intactos.
- Validar assets e dist; SVG somente no catálogo, sem conteúdo ativo/referências externas. Manter galeria e movimento reduzido. Não afirmar revisão visual sem navegador.

## Tecnologia
- HTML/CSS/JavaScript (ES modules). Não introduzir React, backend ou serviços pagos sem justificativa explícita.
- Projeto leve e hospedável como site estático. Testes determinísticos para o motor.
- Manter motor puro, sem DOM; renderização separada. Estruturar programa de modo extensível a AST futura com `if/else`, `switch`, `for`, `while`.
- Não executar código livre do usuário. Não coletar dados pessoais ou telemetria de crianças.

## Qualidade
- Ao alterar o motor, criar/atualizar testes. Testar os mapas e soluções das missões.
- Manter comandos para executar build e testes documentados.
- Em cada tarefa, informar arquivos alterados, testes executados e limitações.
- Não fazer deploy público nem conectar serviços externos sem aprovação.
- Não copiar marcas, textos ou layout dos exemplos de produtos comerciais usados como inspiração.
