# Missões do Robô — Pequenos Programadores

V0.3 jogável de programação visual, em português do Brasil: sequência, coleta, decisões e mundo reativo. Monte o programa antes de executar e leve o robô até a estrela.

## Executar

Requisitos: Node.js 22+ para testes/build e Python 3 para o servidor local. Sem dependências a instalar.

```sh
npm run dev
```

Abra http://localhost:5173. ES modules precisam de servidor HTTP; abrir index.html diretamente não é suportado.

```sh
npm test
npm run build
```

O build gera `dist/`, pronto para hospedagem estática. Valide o pacote e as referências para o subdiretório com:

```sh
node scripts/validate-dist.js
```

URL pública esperada: **https://drigomed.github.io/algo-kids/**. O endereço só estará disponível após habilitar o Pages e concluir a primeira publicação na `main`.

## Jogar

Escolha uma das dezesseis missões. Toque em Avançar, Virar à esquerda ou Virar à direita para adicionar comandos. As setas da lista reordenam; × remove. Executar começa do início; Pausar/Continuar controla a execução; Passo a passo executa um comando. Reiniciar mantém o programa; Limpar apaga os comandos. Alterar um programa pausado reinicia a posição do robô. A direção inicial aparece pela seta sobre o robô; norte fica no topo.

Nas missões 07–08, entrar na casa recolhe o objeto automaticamente. O contador mostra os objetos e a meta da missão. A estrela só encerra a execução quando a meta também estiver satisfeita. Reiniciar restaura todos os objetos e variáveis, preservando o programa.

Nas missões 09–12, adicione **SE / SENÃO**. Escolha **Caminho à frente livre** ou **Contador atingiu uma quantidade**, com variável e quantidade configuráveis. Toque em **Adicionar aqui** no ramo ENTÃO ou SENÃO e use a paleta para inserir os comandos nesse ramo. Também é possível inserir outro SE. **Programa principal** volta a inserir após os blocos principais. As setas reordenam dentro do mesmo ramo; × remove um bloco inteiro, incluindo seus ramos.

Cada decisão é um passo: a interface informa verdadeiro/falso e destaca o bloco e o ramo executados. Um programa pode ter até 300 blocos e 8 níveis de aninhamento. O limite defensivo padrão é de 1.000 instruções executadas (inclui decisões). Não há repetições nesta versão.

As missões 09–16 começam com uma variante de treino. Após vencê-la, toque em **Testar outras versões**. O mesmo programa é executado nos demais cenários, sem sorteio. A missão só é concluída após todas as variantes passarem. Use Pausar/Continuar ou Passo a passo também durante os testes. Editar o programa, reiniciar ou voltar ao treino limpa o resultado da execução atual; uma versão que falha precisa ser corrigida e novamente validada desde o treino.

Na missão 12, um objeto pode alterar a variável de pontos em 1 ou 2. O número de objetos coletados e os pontos são exibidos separadamente; os nomes, valores, efeitos e metas pertencem à missão, não ao motor.

Nas missões 13–16, as perguntas são filtradas pela missão. O SE pode observar um sinal na casa à frente ou comparar uma variável com uma resposta selecionada. Booleanos usam **Sim/Não**, textos usam opções discretas e valores numéricos usam um controle de quantidade. Não é necessário escrever código ou nomes de variáveis.

O tabuleiro diferencia sinais, objetos, placas, estações e passagens abertas/fechadas por símbolos e rótulos além da cor. Os indicadores mostram o estado atual. Pisar numa entidade pode alterar esse estado, abrir uma passagem ou realizar uma entrega condicional; a mudança vale para a próxima decisão e o próximo movimento da mesma execução. Se uma passagem fechar sobre o robô, ele pode sair, mas não reentrar até ela abrir.

## Estrutura

- `src/engine.js`: API pública do motor, sem DOM.
- `src/rules.js`: condições e sensores, regra centralizada de passagem e efeitos declarativos sobre variáveis genéricas.
- `src/world.js`: movimento, entidades, eventos, estado e vitória.
- `src/interpreter.js`: AST, pilha de frames, caminhos ativos, orçamento e simulação.
- `src/program.js`: operações imutáveis da árvore do editor.
- `src/session.js`: treino e validação determinística em múltiplos cenários.
- `src/missions.js`: mantém as missões 01–12 e agrega as missões 13–16 de `src/reactive-missions.js`, com variantes, metadados, dicas e soluções de referência.
- `src/condition-options.js`: autorização, seleção guiada e rótulos das condições.
- `src/ui.js` e `src/view.js`: controles, temporização e representação visual do estado e da AST.
- `src/style.css`: layout responsivo, controles de toque e movimento reduzido.
- `tests/engine.test.js`, `tests/v02.test.js` e `tests/v03.test.js`: regressão, entidades, coleta, estado, condições, interpretação, editor, sessões e soluções de todas as variantes.
- `scripts/build.js`: empacotamento estático sem dependências.
- `docs/V02.md` e `docs/V03.md`: contratos, critérios de aceite, exemplos e roteiros de revisão; `docs/` mantém o escopo original e o roadmap atualizado.

Sem backend, APIs, fontes externas, anúncios, contas, telemetria ou dados pessoais. Progresso fica apenas na memória da página e reinicia ao recarregar. Os comandos são nós tipados; não há execução de código arbitrário.

## Validação e limites

Testes automatizados do motor e build executados. A interface ainda precisa de validação visual em navegadores reais e de uma sessão acompanhada por adulto para confirmar legibilidade, orientação e dificuldade. Não há testes automatizados de navegador ou captura de tela nesta entrega. `for`, `while`, `switch`, som, PWA e persistência ficam para versões posteriores. A pilha do interpretador e o orçamento de instruções poderão ser reaproveitados por novos nós de controle.

## Branches e publicação

- `main`: versão estável e única branch de produção.
- `feat/*`: desenvolvimento; abra Pull Requests com destino à `main`.
- Pushes em branches de desenvolvimento não publicam o site.

A `main` foi criada a partir do commit existente de `feat/mvp-v01`, preservando o histórico. A branch padrão não é alterada automaticamente. Para configurá-la como `main`, um administrador deve acessar **Settings → General → Default branch → Switch to another branch**, selecionar `main` e confirmar. A seção pode aparecer em **Settings → Branches** conforme a interface do GitHub. Confirme que novos PRs usam `main` como base.

O workflow [deploy-pages.yml](.github/workflows/deploy-pages.yml) executa testes, build e validação de `dist/` em PRs para `main` e pushes em `main`, com Node.js 22. Atualmente não há dependências nem lockfile, portanto a instalação é dispensada. Se forem adicionados, atualize o workflow para instalar com o gerenciador e lockfile escolhidos (por exemplo, `npm ci` com `package-lock.json`).

Somente pushes em `main` e execuções manuais explicitamente iniciadas em `main` publicam o artefato validado. PRs não enviam artefatos ao Pages nem executam o job de publicação. Falhas em testes, build ou validação impedem o deploy. O upload contém exclusivamente `dist/` (`index.html` e módulos/estilos em `src/`), sem testes, documentação, credenciais ou dependências de desenvolvimento. A validação rejeita arquivos inesperados, recursos ausentes, links simbólicos, referências a localhost e caminhos incompatíveis com `/algo-kids/`.

O job de publicação depende do build, usa as actions oficiais do Pages e o environment `github-pages`, e expõe a URL no resultado e no resumo da execução. Apenas esse job recebe `pages: write` e `id-token: write`. O grupo de concorrência `github-pages` impede publicações simultâneas e deixa a publicação em andamento terminar. A autenticação do pipeline usa `GITHUB_TOKEN` e OIDC fornecidos pelo GitHub; não crie PATs nem secrets para este fluxo.

## Configurar GitHub Pages

Com acesso administrativo:

1. Em **Settings → Actions → General**, permita GitHub Actions e o uso das actions oficiais utilizadas pelo workflow.
2. Em **Settings → Pages → Build and deployment → Source**, escolha **GitHub Actions**.
3. Em **Settings → Environments → github-pages**, confira as regras de proteção. Se restringir branches de deploy, permita `main` e não permita `feat/*`. Aprovações obrigatórias nesse environment precisam ser atendidas antes da publicação.
4. Integre o PR de infraestrutura à `main`. O push resultante dispara a primeira publicação; aguarde os jobs **Testes e build** e **Publicar** ficarem verdes.
5. Abra a URL exibida pelo job e confira o tabuleiro, estilos e comandos em `https://drigomed.github.io/algo-kids/`.

Para republicar manualmente: **Actions → Validar e publicar no GitHub Pages → Run workflow → Branch: main**. O botão manual depende de o workflow existir na branch padrão; configure `main` como padrão após a integração para disponibilizá-lo. Selecionar outra branch nunca autoriza o deploy.

O repositório é **público** e o Pages foi configurado após a entrega da infraestrutura. A V0.3 é entregue em PR e não faz deploy manual nem altera configurações de publicação. Após aprovação e merge na `main`, o workflow existente publica a versão. Se for necessário refazer a configuração, siga as instruções administrativas acima. O campo `private: true` do `package.json` impede publicação acidental no npm e não determina a visibilidade do GitHub. Se o repositório passar a privado, confirme a elegibilidade do Pages no plano da conta em **Settings → Pages** e nas configurações de cobrança. Repositório privado não garante site privado. Se o plano não oferecer Pages para repositórios privados, as alternativas são contratar um plano compatível ou tornar o repositório público **somente mediante aprovação do responsável**. Este workflow não altera plano, visibilidade ou branch padrão.

Para exigir a validação antes de integrar PRs, um administrador pode criar uma regra para `main` em **Settings → Rules → Rulesets** (ou **Branches → Branch protection**), exigir Pull Request e o check **Testes e build**, e bloquear force pushes. Essa proteção depende das opções disponíveis no plano e não é criada automaticamente pelo workflow.

## Diagnosticar publicação

- **Testes/build/validação falham:** abra **Actions → execução → Testes e build**; corrija a primeira etapa vermelha. Reproduza com `npm test`, `npm run build` e `node scripts/validate-dist.js` em Node.js 22.
- **Deploy ignorado em PR ou `feat/*`:** comportamento esperado; apenas `main` publica. Um push em `feat/*` sem PR para `main` não inicia este workflow.
- **Pages não habilitado, 404 ou erro de configuração:** confirme **Settings → Pages → Source: GitHub Actions**, o plano e a disponibilidade de Pages, a existência de `main` e o merge do workflow. O endereço esperado pode retornar 404 antes da primeira publicação bem-sucedida.
- **403/permissão negada:** verifique se as actions estão permitidas pelas políticas da conta/organização e se o job de publicação conserva `pages: write` e `id-token: write`. Não substitua por token pessoal.
- **Aguardando aprovação ou branch recusada:** confira as regras do environment `github-pages` e autorize `main`.
- **Página sem estilos ou scripts:** confira no navegador as requisições dentro de `/algo-kids/`. Os caminhos da aplicação devem continuar relativos; execute novamente a validação do pacote.
- **Run workflow indisponível:** o arquivo precisa estar na branch padrão. Integre o PR e configure `main` como padrão conforme as instruções acima.

O build continua estático e o jogo continua sem backend. Um workflow versionado ou Pages habilitado, isoladamente, não confirma que o site foi publicado: confira o sucesso do job **Publicar** e o endereço retornado.
