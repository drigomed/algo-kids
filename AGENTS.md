# Instruções para Codex e agentes de desenvolvimento

Leia `README.md`, `docs/PRODUCT.md`, `docs/ROADMAP.md`, `docs/MVP.md`, `docs/V02.md`, `docs/V03.md`, `docs/V04.md`, `docs/V05.md`, `docs/V06.md` e `docs/V07.md` antes de implementar.

## Produto
- Jogo educativo de programação visual para criança de 6 anos, em pt-BR.
- Conceito central: **a criança constrói um algoritmo, depois o robô executa**.
- Preferir UX simples, agradável, visual, responsiva e acessível ao toque.
- Preservar integralmente definições e soluções 01–23, especialmente apresentação e comandos infantis 01–06. V0.7 acrescenta for/while nativos autorizados por loopOptions; 24–25 são somente fixtures técnicas. Sem expansão da AST, break/continue ou iterador local.
- Trocar presets de laço na mesma categoria preserva body; trocar de categoria não é edição silenciosa. Checks consomem orçamento, inclusive saída; while reavalia o estado atual.
- Nunca descartar corpos de casos silenciosamente ao trocar configuração. Validar caminhos cases/body/default e body de for/while, profundidade estrutural e permissões também no motor.
- Motor genérico: ações, condições e regras de passagem não conhecem nomes de objetos. Aparência e mensagens pertencem aos dados das missões.
- Um movimento proibido continua sendo um programa válido: falha em runtime, sem entrar na casa ou aplicar efeitos. Não corrigir a rota nem bloquear a escolha no editor. Física não depende da memória.
- Mundo e memória são namespaces distintos. Comandos e perguntas precisam de autorização declarativa, verificada também no motor. Nenhuma falha de interação pode publicar efeitos parciais.

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
