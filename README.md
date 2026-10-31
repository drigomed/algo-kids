# Missões do Robô — Pequenos Programadores

MVP V0.1 jogável de programação sequencial, em português do Brasil. Monte o programa antes de executar e leve o robô até a estrela.

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

Escolha uma das seis missões. Toque em Avançar, Virar à esquerda ou Virar à direita para adicionar comandos. As setas da lista reordenam; × remove. Executar começa do início; Pausar/Continuar controla a execução; Passo a passo executa um comando. Reiniciar mantém o programa; Limpar apaga os comandos. Alterar um programa pausado reinicia a posição do robô. A direção inicial aparece pela seta sobre o robô; norte fica no topo.

## Estrutura

- `src/engine.js`: motor puro, estados, validação e simulação determinística.
- `src/missions.js`: seis missões progressivas, dicas e soluções de referência.
- `src/ui.js`: editor, execução temporizada e renderização.
- `src/style.css`: layout responsivo, controles de toque e movimento reduzido.
- `tests/engine.test.js`: movimento, rotações, colisões, vitória, determinismo e soluções das seis missões.
- `scripts/build.js`: empacotamento estático sem dependências.
- `docs/`: especificação original de produto, escopo e roadmap.

Sem backend, APIs, fontes externas, anúncios, contas, telemetria ou dados pessoais. Progresso fica apenas na memória da página e reinicia ao recarregar. Os comandos são nós tipados; não há execução de código arbitrário.

## Validação e limites

Testes automatizados do motor e build executados. A interface ainda precisa de validação visual em navegadores reais e de uma sessão acompanhada por adulto para confirmar legibilidade, orientação e dificuldade. Não há testes automatizados de navegador ou captura de tela nesta entrega. Loops, decisões, som, PWA e persistência ficam para versões posteriores.

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

Na verificação desta entrega, o repositório estava **público**, com Pages ainda não configurado; nenhuma alteração de visibilidade é necessária. A tentativa de habilitar Pages pela API retornou `403 — Resource not accessible by integration`, apesar de a consulta ao repositório indicar acesso administrativo. Isso indica uma limitação de permissão da integração; um administrador deve realizar a etapa **Settings → Pages → Source → GitHub Actions** pela interface do GitHub. O deploy não está concluído enquanto essa configuração e a primeira execução na `main` não tiverem sucesso. O campo `private: true` do `package.json` impede publicação acidental no npm e não determina a visibilidade do GitHub. Se o repositório passar a privado, confirme a elegibilidade do Pages no plano da conta em **Settings → Pages** e nas configurações de cobrança. Repositório privado não garante site privado. Se o plano não oferecer Pages para repositórios privados, as alternativas são contratar um plano compatível ou tornar o repositório público **somente mediante aprovação do responsável**. Este workflow não altera plano, visibilidade ou branch padrão.

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
