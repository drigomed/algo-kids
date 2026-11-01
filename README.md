# Missões do Robô — Pequenos Programadores

V0.9.1 do Algo Kids: jogo educativo em português e Studio local de autoria de missões, com o mesmo motor e os 85 SVGs originais da V0.8. Monte o programa antes de executar e leve o robô até a estrela.

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

As definições e soluções 01–19 e 21–25 continuam preservadas; a V0.9.1 corrige somente o mapa e a referência da Missão 20 para uma bifurcação real. As missões 01–06 mantêm seus comandos e jogabilidade; a V0.8 atualiza somente sua arte. Os cenários 17–25 são demonstrações temporárias do motor; a V0.7 acrescenta somente as fixtures 24–25. Toque em Avançar, Virar à esquerda ou Virar à direita para adicionar comandos. As setas da lista reordenam; × remove. Executar começa do início; Pausar/Continuar controla a execução; Passo a passo executa um comando. Reiniciar mantém o programa; Limpar apaga os comandos. Alterar um programa pausado reinicia a posição do robô. A direção inicial aparece pela seta sobre o robô; norte fica no topo.

Nas missões 07–08, entrar na casa recolhe o objeto automaticamente. O contador mostra os objetos e a meta da missão. A estrela só encerra a execução quando a meta também estiver satisfeita. Reiniciar restaura todos os objetos e variáveis, preservando o programa.

Nas missões 09–12, adicione **SE / SENÃO**. Escolha **Caminho à frente livre** ou **Contador atingiu uma quantidade**, com variável e quantidade configuráveis. Toque em **Adicionar aqui** no ramo ENTÃO ou SENÃO e use a paleta para inserir os comandos nesse ramo. Também é possível inserir outro SE. **Programa principal** volta a inserir após os blocos principais. As setas reordenam dentro do mesmo ramo; × remove um bloco inteiro, incluindo seus ramos.

Cada decisão é um passo: a interface informa verdadeiro/falso e destaca o bloco e o ramo executados. Um programa pode ter até 300 blocos e 8 níveis de aninhamento. O limite defensivo padrão é de 1.000 instruções executadas (inclui decisões). Repetições são habilitadas apenas nas missões que declaram `loopOptions`, sem acrescentar comandos às paletas 01–23.

As missões 09–16 começam com uma variante de treino. Após vencê-la, toque em **Testar outras versões**. O mesmo programa é executado nos demais cenários, sem sorteio. A missão só é concluída após todas as variantes passarem. Use Pausar/Continuar ou Passo a passo também durante os testes. Editar o programa, reiniciar ou voltar ao treino limpa o resultado da execução atual; uma versão que falha precisa ser corrigida e novamente validada desde o treino.

Na missão 12, um objeto pode alterar a variável de pontos em 1 ou 2. O número de objetos coletados e os pontos são exibidos separadamente; os nomes, valores, efeitos e metas pertencem à missão, não ao motor.

Nas missões 13–16, as perguntas são filtradas pela missão. O SE pode observar um sinal na casa à frente ou comparar uma variável com uma resposta selecionada. Booleanos usam **Sim/Não**, textos usam opções discretas e valores numéricos usam um controle de quantidade. Não é necessário escrever código ou nomes de variáveis.

O tabuleiro diferencia sinais, objetos, placas, estações e passagens abertas/fechadas por símbolos e rótulos além da cor. Os indicadores mostram o estado atual. Pisar numa entidade pode alterar esse estado, abrir uma passagem ou realizar uma entrega condicional; a mudança vale para a próxima decisão e o próximo movimento da mesma execução. Se uma passagem fechar sobre o robô, ele pode sair, mas não reentrar até ela abrir.

Nos cenários 17–19, a paleta oferece comandos autorizados pela configuração:
- **Inspecionar** observa uma propriedade na casa à frente e guarda uma cópia.
- **Guardar valor** define um valor permitido na memória do robô.
- **Interagir** executa uma ação declarada no objeto à frente ou na casa atual.

A memória é separada do estado do mundo e aparece com **?** enquanto desconhecida. O SE pode consultar a informação guardada; tentar decidir antes de defini-la encerra a execução com uma dica, sem executar SENÃO. Alterar o mundo depois de inspecionar não atualiza a memória automaticamente.

Ao selecionar ENTÃO ou SENÃO, use a paleta do próprio ramo para inserir vários blocos, preservando o destino de inserção e a rolagem. Os novos comandos têm configurações guiadas e não exigem escrever código. No passo a passo, a interface apresenta **pergunta → resposta → ramo** e marca a casa no alcance da ação.

O exemplo completo [V04-example.json](docs/V04-example.json) pode ser carregado, validado e executado sem modificar o motor. Os contratos, falhas, eventos e roteiro manual estão em [V04.md](docs/V04.md). Uma interação malsucedida não deixa efeitos parciais; reiniciar restaura mundo, memória, consumo e ações de uso único. A coleta e os efeitos automáticos antigos continuam funcionando como antes.

Na V0.5, condições numéricas comparam números do mundo ou da memória com tipos estritos. As regras físicas também podem consultar propriedades da própria passagem. Uma capacidade declarada é a mesma usada na regra, na inspeção e na apresentação.

**Um programa pode tentar atravessar uma passagem proibida.** O editor aceita esse movimento; na tentativa de entrada, o motor bloqueia a passagem, interrompe o programa e informa o motivo e os valores relevantes. Não há correção automática da rota nem descarte de carga. Conhecer ou desconhecer a capacidade não altera a física. Término sem objetivo aparece como programa incompleto; colisão, falha de ação e limite aparecem como falha.

Inspecionar também pode ler propriedades de objetos e barreiras à frente ou na casa atual, nos alcances autorizados. Quando há vários objetos no mesmo local, escolha a opção que identifica o alvo. Objetos consumidos/coletados deixam de estar disponíveis. As guardas de interação podem usar comparações numéricas; uma pré-condição falsa é uma falha de execução, sem efeitos parciais.

O exemplo completo [V05-example.json](docs/V05-example.json) e os contratos de [V05.md](docs/V05.md) mostram a autoria por configuração. A demo 20 testa cargas e capacidades (incluindo tentativas negativas nos testes); a 21 testa inspeção de um objeto e escolha entre três alvos, sem switch.

Na V0.6, **ESCOLHA** consulta uma informação conhecida da memória ou do mundo e executa somente um **CASO**. Se o valor conhecido não tiver caso, executa **OUTRO VALOR**. Memória desconhecida interrompe o programa e não executa o padrão. Zero, Não e texto vazio são valores conhecidos. Após o caminho escolhido, o robô retoma a sequência principal; não há fallthrough nem repetição.

Selecione **Adicionar aqui** no caso, padrão, ENTÃO ou SENÃO desejado. A paleta fica apenas nesse local, no fim da sequência; várias inserções mantêm o destino. O caminho de inserção aparece em texto, e **Voltar ao programa principal** muda explicitamente para a raiz. Os comandos podem ser removidos/reordenados dentro dos casos. Valores e ordem dos casos vêm da missão, sem edição livre. Trocar um preset preenchido ou remover um bloco estruturado com comandos pede confirmação; cancelar mantém o programa.

A demo 22 mantém a inspeção e as três chaves da 21, mas usa um switch real. A 21 continua com SE/SENÃO. A demo 23 usa um valor numérico do mundo, dois casos e um padrão efetivamente vencedor. Os contratos, limites, evento, caminhos e roteiro estão em [V06.md](docs/V06.md), com exemplo completo [V06-example.json](docs/V06-example.json).

Na V0.7, **REPITA N VEZES** executa seu CORPO exatamente N vezes (1–20 conforme as opções da missão). **ENQUANTO** consulta novamente a pergunta antes de cada iteração; falso segue após o bloco, e informação desconhecida interrompe com uma explicação. Cada check é um passo, inclusive o falso de saída: quatro avanços no REPITA custam 5 checks + 4 movimentos. Pausar/Continuar preserva o contador; Reiniciar restaura a execução.

Selecione **Adicionar aqui** no CORPO e use sua paleta local. Volte explicitamente ao programa principal para inserir os comandos posteriores. Trocar presets da mesma categoria preserva o corpo; remover um bloco preenchido pede confirmação. Uma execução longa continua sujeita ao orçamento defensivo; a V0.7.1 também detecta ciclos sem progresso, mantendo a interface pausável. Não há expansão da AST nem mudança na física.

As demos 24/25 verificam repetição contada e corredor de comprimento variável. São fixtures técnicas, não novas etapas pedagógicas definitivas. Consulte [V07.md](docs/V07.md) para contratos, eventos, orçamento, resultados e revisão no celular; [V07-example.json](docs/V07-example.json) exemplifica autoria inteiramente declarativa. **565 testes passaram**, além de build e validação do artefato estático (139 arquivos, 278 referências). A revisão visual em aparelho permanece pendente; a entrega é por PR, sem merge automático.

Na V0.7.1, um **ENQUANTO** que reencontra a mesma situação com condição verdadeira termina como falha por falta de progresso. A comparação inclui posição, direção, mundo, memória, coleta, consumo e interações; não considera somente se o robô andou. O histórico é separado por ativação, com janela de 256 assinaturas; o orçamento continua protegendo execuções longas. REPITA finito e algoritmos que alteram estado continuam funcionando.

**■ Interromper** aparece durante execução, pausa ou após passo manual. Cancela os próximos passos e conserva a posição/estado, sem contar instrução. **Pausar** permite continuar; **Reiniciar** restaura o começo; **Executar** após interrupção recomeça com o mesmo programa. Interrupção não é falha do algoritmo: mostra **Interrompido por você**. Durante variantes, conserva as vitórias anteriores e cancela o avanço pendente sem concluir a missão.

Os contratos, ajustes justificados dos testes e roteiro de revisão estão em [V071.md](docs/V071.md). Nenhuma missão 01–25 mudou. Testes do controlador usam agendador simulado para provar cancelamento imediato e rejeição de callbacks antigos; revisão visual real no celular continua pendente.

Na V0.8, o mesmo robô verde evolui de MK1 a MK4, com grama, trilha, pátio, fábrica e estacionamento. Os **85 SVGs originais** estão versionados e integrados: robôs cardinais, pisos, metas, obstáculos, coletáveis, objetos reativos, efeitos e ícones. A configuração visual é separada das missões e do motor; temas não alteram a física. Vitória, falha, estagnação e parada voluntária têm placas distintas, com formas e textos além da cor. Movimento reduzido preserva o feedback estático.

Abra a **[galeria de revisão](docs/V08-GALLERY.html)** em `http://localhost:5173/docs/V08-GALLERY.html` após `npm run dev`. Ela mostra todos os assets em 48/64 px, sobre fundos claro/escuro, e os quatro MK lado a lado. O [guia V08](docs/V08.md) documenta catálogo, adaptação declarativa, fallbacks, segurança e roteiro de revisão. Para validar/regenerar: `node scripts/validate-assets.js` e `node scripts/generate-art.mjs`. Não há dependências a instalar.

A regressão preserva as 25 definições e os traces das 43 variantes da V0.7.1. Não houve mudança no interpretador, regras, soluções ou temporizadores. Revisão estética no celular permanece pendente; não há capturas de navegador neste ambiente. A entrega é via PR, sem merge/deploy manual.

## Studio de Missões (adultos/autores)

Execute `npm run dev` e abra **http://localhost:5173/studio/**. Após integrar/publicar pela main, a entrada esperada é **https://drigomed.github.io/algo-kids/studio/**. A ferramenta é estática/local e a URL é pública, sem autenticação. A entrega em PR não implica publicação.

Crie mapa por toque/clique/teclado, edite regras em formulários estruturados, configure variantes e monte a solução por blocos. Use Testar todas as variantes para conferir o programa de referência. Exportar gera JSON puro; importar reproduz regras/tipos/AST e não altera o catálogo. O Studio mantém um único rascunho em localStorage, com desfazer/refazer em memória. Se armazenamento falhar, continua funcionando e orienta exportar o trabalho.

[Uso e limites](docs/V09.md) · [Contrato mission-json/v1](docs/V09-JSON-CONTRACT.md) · [Exemplo reativo exportado](docs/V09-example.json). O jogo infantil na raiz, suas 25 definições/soluções e os 85 SVGs permanecem preservados. Nenhuma missão é publicada automaticamente pelo Studio. Revisão real de UX no celular permanece pendente; os testes de controlador não substituem navegador.

A [visão V2.0](docs/V20-PLATFORM-VISION.md) planeja níveis versionados, escolas, administradores, instrutores, alunos, turmas, matrículas, atribuições e progresso. **Não há backend, login, gestão institucional ou dados de alunos na V0.9.**

## V0.9.1 — Conteúdo local e energia opcional

O Studio separa **Importar/Exportar missão** de **Importar/Exportar rascunho (.akdraft.json)**. Drafts incompletos continuam editáveis e portáteis, sem fingir validade de runtime. A paleta é agrupada por finalidade e cada bloco tem **Subir / Descer / Excluir**, inclusive em ramos, com confirmação de conteúdo e undo/redo.

No jogo da raiz, **Jogar missão importada** abre JSON válido exportado pelo Studio, sem preencher o programa da criança, alterar catálogo ou conquistas. **Voltar às missões** restaura a sessão oficial anterior. A importação usa o mesmo contrato/validador do Studio; drafts não são jogáveis.

Energia é opt-in por missão/variante: bateria e seis custos definidos pelo autor; qualquer solução que conclua dentro da bateria vence. Não há resolvedor de ótimo. Missões oficiais não exibem bateria. A Missão 20 agora tem dois corredores fechados por caixas, A até 1 pacote e rota B reservada a 2–3, exigindo a decisão nas variantes.

[Contratos, testes e pendências V0.9.2](docs/V091.md) · [Exemplo de energia](docs/V091-energy-example.json) · [Draft parcial](docs/V091-draft-example.akdraft.json). Sem backend ou deploy manual; revisão visual real permanece pendente.

## Estrutura

- `src/engine.js`: API pública do motor, sem DOM.
- `src/rules.js`, `src/numbers.js` e `src/properties.js`: condições, operandos tipados, propriedades observáveis, passagem centralizada e efeitos declarativos.
- `src/world.js`: movimento, entidades, eventos, estado e vitória.
- `src/data.js`, `src/memory.js` e `src/commands.js`: validação JSON, memória tipada, autorização de comandos e execução transacional de interações.
- `src/interpreter.js`: AST, pilha de frames, caminhos ativos, orçamento e simulação.
- `src/program.js` e `src/tree.js`: operações imutáveis, caminhos estruturais, contagem e seleção do editor.
- `src/switches.js`: autorização, criação e seleção nativa de switch.
- `src/loops.js` e `src/loop-view.js`: contratos declarativos de repetição, corpos e progresso visual; frames são executados pelo interpretador existente.
- `src/session.js`: treino e validação determinística em múltiplos cenários.
- `src/missions.js`: mantém as missões 01–12 e agrega as missões 13–16 de `src/reactive-missions.js`, com variantes, metadados, dicas e soluções de referência.
- `src/demo-missions-v05.js`: apenas as duas demonstrações novas de física e seleção de alvos.
- `src/demo-missions-v06.js`: somente as duas fixtures da V0.6, preservadas.
- `src/demo-missions-v07.js`: somente as demonstrações técnicas 24–25.
- `src/switch-view.js`, `src/branch-view.js` e `src/switch-copy.js`: escolhas, controles de ramo compartilhados e narrativa visual.
- `src/condition-options.js`: autorização, seleção guiada e rótulos das condições.
- `src/ui.js`, `src/view.js`, `src/command-view.js` e `src/html.js`: controles, temporização e representação visual do estado e da AST.
- `src/style.css`: layout responsivo, controles de toque e movimento reduzido.
- `tests/engine.test.js`, `tests/v02.test.js`, `tests/v03.test.js`, `tests/v04.test.js`, `tests/v05.test.js`, `tests/v06.test.js`, `tests/v07.test.js` e `tests/v071.test.js`: regressão, entidades, coleta, estado, condições, interpretação, editor, sessões e soluções de todas as variantes.
- `src/assets/`: 85 SVGs originais locais; `src/presentation/`: registry, configuração, resolvedor, efeitos e composição da cena.
- `tests/v08.test.js` e `tests/fixtures/v071-domain-baseline.json`: catálogo, segurança, apresentação e regressão do domínio.
- `studio/index.html` e `src/studio/`: editor separado, formulários, modelo imutável, variantes, playtest, I/O e autosave.
- `tests/v09.test.js`: fluxos de autoria/controlador, round-trip, variantes e segurança.
- `scripts/build.js`, `scripts/validate-assets.js` e `scripts/validate-dist.js`: empacotamento e validação estáticos, incluindo SVGs autorizados.
- `scripts/generate-art.mjs`: geração local reproduzível da arte e da galeria.
- `docs/V02.md`, `docs/V03.md`, `docs/V04.md`, `docs/V05.md`, `docs/V06.md`, `docs/V07.md` e `docs/V071.md`: contratos, critérios de aceite, exemplos e roteiros de revisão; `docs/` mantém o escopo original e o roadmap atualizado.

Sem backend, APIs, fontes externas, anúncios, contas, telemetria ou dados pessoais. Progresso fica apenas na memória da página e reinicia ao recarregar. Os comandos são nós tipados; não há execução de código arbitrário.

## Validação e limites

Testes automatizados do motor e build executados. A interface ainda precisa de validação visual em navegadores reais e de uma sessão acompanhada por adulto para confirmar legibilidade, orientação e dificuldade. Não há testes automatizados de navegador ou captura de tela nesta entrega. Som, PWA, progresso persistente do jogador e break/continue ficam para versões posteriores. O editor de mapas e o rascunho local de autoria estão disponíveis no Studio V0.9. A pilha do interpretador e o orçamento de instruções poderão ser reaproveitados por novos nós de controle.

## Branches e publicação

- `main`: versão estável e única branch de produção.
- `feat/*`: desenvolvimento; abra Pull Requests com destino à `main`.
- Pushes em branches de desenvolvimento não publicam o site.

A `main` foi criada a partir do commit existente de `feat/mvp-v01`, preservando o histórico. A branch padrão não é alterada automaticamente. Para configurá-la como `main`, um administrador deve acessar **Settings → General → Default branch → Switch to another branch**, selecionar `main` e confirmar. A seção pode aparecer em **Settings → Branches** conforme a interface do GitHub. Confirme que novos PRs usam `main` como base.

O workflow [deploy-pages.yml](.github/workflows/deploy-pages.yml) executa testes, build e validação de `dist/` em PRs para `main` e pushes em `main`, com Node.js 22. Atualmente não há dependências nem lockfile, portanto a instalação é dispensada. Se forem adicionados, atualize o workflow para instalar com o gerenciador e lockfile escolhidos (por exemplo, `npm ci` com `package-lock.json`).

Somente pushes em `main` e execuções manuais explicitamente iniciadas em `main` publicam o artefato validado. PRs não enviam artefatos ao Pages nem executam o job de publicação. Falhas em testes, build ou validação impedem o deploy. O upload contém exclusivamente `dist/` (`index.html`, `studio/index.html` e módulos/estilos/SVGs autorizados em `src/`), sem testes, documentação, credenciais ou dependências de desenvolvimento. A validação rejeita arquivos inesperados, recursos ausentes, links simbólicos, referências a localhost e caminhos incompatíveis com `/algo-kids/`.

O job de publicação depende do build, usa as actions oficiais do Pages e o environment `github-pages`, e expõe a URL no resultado e no resumo da execução. Apenas esse job recebe `pages: write` e `id-token: write`. O grupo de concorrência `github-pages` impede publicações simultâneas e deixa a publicação em andamento terminar. A autenticação do pipeline usa `GITHUB_TOKEN` e OIDC fornecidos pelo GitHub; não crie PATs nem secrets para este fluxo.

## Configurar GitHub Pages

Com acesso administrativo:

1. Em **Settings → Actions → General**, permita GitHub Actions e o uso das actions oficiais utilizadas pelo workflow.
2. Em **Settings → Pages → Build and deployment → Source**, escolha **GitHub Actions**.
3. Em **Settings → Environments → github-pages**, confira as regras de proteção. Se restringir branches de deploy, permita `main` e não permita `feat/*`. Aprovações obrigatórias nesse environment precisam ser atendidas antes da publicação.
4. Integre o PR de infraestrutura à `main`. O push resultante dispara a primeira publicação; aguarde os jobs **Testes e build** e **Publicar** ficarem verdes.
5. Abra a URL exibida pelo job e confira o tabuleiro, estilos e comandos em `https://drigomed.github.io/algo-kids/`.

Para republicar manualmente: **Actions → Validar e publicar no GitHub Pages → Run workflow → Branch: main**. O botão manual depende de o workflow existir na branch padrão; configure `main` como padrão após a integração para disponibilizá-lo. Selecionar outra branch nunca autoriza o deploy.

O repositório é **público** e o Pages foi configurado após a entrega da infraestrutura. A V0.9.1 é entregue em PR e não faz deploy manual nem altera configurações de publicação. Após aprovação e merge na `main`, o workflow existente publica a versão. Se for necessário refazer a configuração, siga as instruções administrativas acima. O campo `private: true` do `package.json` impede publicação acidental no npm e não determina a visibilidade do GitHub. Se o repositório passar a privado, confirme a elegibilidade do Pages no plano da conta em **Settings → Pages** e nas configurações de cobrança. Repositório privado não garante site privado. Se o plano não oferecer Pages para repositórios privados, as alternativas são contratar um plano compatível ou tornar o repositório público **somente mediante aprovação do responsável**. Este workflow não altera plano, visibilidade ou branch padrão.

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
