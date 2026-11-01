# Instruções para Codex e agentes de desenvolvimento

Leia `README.md`, `docs/PRODUCT.md`, `docs/ROADMAP.md`, `docs/MVP.md`, `docs/V02.md` e `docs/V03.md` antes de implementar.

## Produto
- Jogo educativo de programação visual para criança de 6 anos, em pt-BR.
- Conceito central: **a criança constrói um algoritmo, depois o robô executa**.
- Preferir UX simples, agradável, visual, responsiva e acessível ao toque.
- Preservar 01–12; V0.3 acrescenta sensores, estado, passagem dinâmica e interações nas missões 13–16. Não antecipar for, while ou switch.
- Motor genérico: ações, condições e regras de passagem não conhecem nomes de objetos. Aparência e mensagens pertencem aos dados das missões.

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
