# V0.9.3 — Relatório de validação

Base main `ee40b0ddbf39f6583ec2033bb9b7f07189ef9f18`, branch `feat/v093-ux-progression-map-labels`. Sem merge automático, deploy manual, alteração de configuração do Pages ou novas dependências.

## Comandos e resultados reais

| Comando | Resultado |
|---|---|
| npm test (baseline main V092 antes das alterações) | 751 aprovados |
| npm test (entrega V093) | **823 aprovados**, zero falhas, cancelamentos ou ignorados |
| npm run build | Aprovado, dist estático |
| node scripts/validate-assets.js | **91 SVGs, 61.397 bytes**, todos preservados por SHA-256 |
| node scripts/validate-dist.js | **151 arquivos, 305 referências**, compatíveis com /algo-kids/ e /algo-kids/studio/ |
| node scripts/audit-map-identification.mjs | **33 missões / 71 cenários / 232 ocorrências de recursos / 157 identificações** |
| node scripts/browser-smoke.mjs | **10 verificações em Chromium 154**, zero exceções/recursos ausentes, **15 capturas reais** |
| node --check em src/scripts/tests e script de navegador | Sem erros |
| git diff --check | Sem erros |

A suíte V093 contém 72 testes específicos; as suites históricas continuam sendo executadas. Não houve expansão do catálogo: a grade importada 3×3 é somente fixture de teste e não uma missão nova oficial.

## Geometria e execução confirmadas

Robô (2,1), pilha (2,2), lixeira (3,1), estrela (2,4), índices zero-based. Ciclo começa/termina olhando leste. Cada descarte confirmado acontece em (3,1), com posse prévia; o comando remoto em (2,1) falha outOfReach, sem efeitos ou energia consumida.

| Missão / cenário | Instruções executadas | Consumo / orçamento / restante |
|---|---:|---|
| 30 / caixas1 | 14 | Energia desabilitada |
| 30 / caixas2 | 23 | Energia desabilitada |
| 30 / caixas3 | 32 | Energia desabilitada |
| 31 / caixas0 | 4 | Sem corpo nem visita à lixeira |
| 31 / caixas1 | 13 | Energia desabilitada |
| 31 / caixas2 | 22 | Energia desabilitada |
| 31 / caixas3 | 31 | Energia desabilitada |
| 33 / caixas1 | 13 | 18 / 20 / 2 |
| 33 / caixas2 | 22 | 30 / 32 / 2 |

As contagens incluem checks. Referências e alternativas são aceitas; um par de giros extras cabe na margem. Alterar os dois giros de retorno à direita para dois à esquerda também vence. Não há prova/busca de ótimo.

## Cobertura e preservação

- **01–08:** hashes integrais das definições, todos os traces e HTML inicial dos tabuleiros iguais à baseline V092. Header e catálogo recebem somente as mudanças globais contratadas; comandos e jogabilidade não mudam.
- **Outras 30 missões:** domínio/AST/trace V092 mantidos, permitindo apenas presentation onde autorizado. Só 30/31/33 mudam mundo/solução/energia conforme spec.
- **71 cenários:** referências únicas por missão vencem; sessões, passos, playtest, reset, interrupção e JSON cobertos. Inspeção continua necessária para memória, falhas de física/interação continuam em runtime, e testes de limites/stalled/energia permanecem ativos.
- **Progresso:** ordem do catálogo (incluindo IDs não consecutivos e tipos estritos), prefixo, duplicados/desconhecidos, dados maliciosos/corrompidos, storage ausente/quota, vitória parcial/final, replay, refresh, última missão e handler com dataset adulterado. Falha de save mantém vitória em memória. Não há migração fictícia: V092 só tinha Set volátil.
- **Isolamento:** prévia de 1/2/3/4 cenários, estado inicial independente, AST/target/session/caches/conquistas/timers/foco preservados, edição/pausa/playback, reset/importação/retorno e caso de cenário que já nasce na meta sem celebração de prévia. Execução real continua pelo treino e startVariantTests.
- **Identificação:** entidades/barreiras/propriedades renderizadas com texto efetivamente visível; permissões A/B sem portões inventados, pontes A/B, chaves/letras/formas, estações e quantidades. Valor 0, false e tipos preservados; observação oculta protegida em texto/aria, quantidade, detalhes e sprites, inclusive depois de mudar a verdade do mundo.
- **Segurança/Studio:** vínculos inválidos, memória não declarada, labels/badges longos e descritores com scripts/URL são rejeitados; texto hostil é escapado. Formulários e round-trip completos/drafts parciais mantêm novos metadados. Studio não consulta progresso oficial.
- **Assets:** 91 hashes da base conferidos, nenhum SVG novo ou alterado. Header usa MK1 leste local, decorativo e relativo. Galeria/segurança V08 continuam na suíte.

Portabilidade dos snapshots: a primeira CI identificou raiz absoluta do checkout nos URLs file:// de assets dentro do HTML. A baseline foi recalculada a partir do renderer V092 histórico, normalizando somente file://<checkout>/src/assets/ para assets/. Todo o HTML, nomes/caminhos relativos e sprites continuam comparados; a validação não depende do diretório da máquina. A suíte completa também passou com 823 testes numa cópia em /tmp/algo-v093-portability, fora do checkout original.

Ajustes históricos limitados: V08 verifica antes/depois de inspeção em vez de aceitar vazamento inicial; V08/V092 comparam domínio separadamente da apresentação autorizada. Testes de caixa da V092 executam o transporte físico antes de descartar e preservam contraprovas de pilha vazia/retirada dupla. Novas baselines continuam estritas nas primeiras oito missões; nenhum teste histórico foi apagado.

## Auditoria de identificação

[V093-MAP-IDENTIFICATION-AUDIT.md](V093-MAP-IDENTIFICATION-AUDIT.md) tem matriz de todos os recursos por cenário real: **232 ocorrências**, incluindo **157 marcas configuradas**, sendo **138 novas marcas compactas e 19 reutilizadas**, mais **24 ocorrências de recursos com propriedades protegidas (28 vínculos propriedade→memória)**. Os 71 destinos usam estrela, e quatro coletáveis nas primeiras missões conservam identificação gráfica coletiva.

Contagens são por cenário, não objetos únicos. Metadados originais de badges foram auditados a partir do git archive da base ee40b0d e registrados em tests/fixtures/v092-visible-labels.json. Propriedades já tinham pequenos rótulos antes, mas recebem marca compacta/legibilidade/proteção quando necessário; não se afirma que eram todas anônimas.

## Chromium real e capturas

[Relatório JSON](review-v093/report.json). Chromium headless 154 sobre dist em /algo-kids/, com cache desabilitado para evitar capturas de CSS antigo. Viewports **360×800**, **390×844**, **1366×900**; movimento reduzido e normal. Testes reais usam os handlers/controles do jogo e Studio, sem substituir a engine.

1. Header MK1, catálogo inicialmente bloqueado; vitória 01 salva prefixo e reload abre 02.
2. Fixture de progresso permite revisar níveis avançados somente no teste, sem atalho público.
3. Prévia 3/3 durante inserção de comando mantém tabuleiro, status real e storage.
4. Retirada, posse sobre lixeira em (3,1), descarte e retorno observados; treino da 30 não salva 30, todas as variantes depois salvam e liberam 31.
5. Quatro chaves em quadrantes distintos, marcas em cor/cinza, atributo oculto ? e prévia 4/4 sem nomes que revelem respostas.
6. Controle A/B, porta e desvio da 27; desktop normal e Studio livre validando as três variantes.
7. Grade importada 3×3 e teste puro de prévia 3×4, sem dimensões fixas no renderer.
8. Ausência de overflow horizontal nos pontos verificados e de exceções/404 de assets.

Capturas:

- [Início/header/bloqueios](review-v093/mobile-inicio.png) · [Desbloqueio](review-v093/mobile-progresso.png)
- [Lixeira separada](review-v093/mobile-lixeira-separada.png) · [Transportando](review-v093/mobile-transportando.png) · [Descarte](review-v093/mobile-descartado.png) · [Concluído](review-v093/mobile-descarte-concluido.png)
- [Prévia 3/3](review-v093/mobile-previa.png) · [Prévia 4/4](review-v093/mobile-previa-quatro.png)
- [Quatro chaves](review-v093/mobile-quatro-chaves.png) · [Cinza](review-v093/mobile-chaves-cinza.png)
- [A/B no celular](review-v093/mobile-permissoes.png) · [A/B desktop](review-v093/desktop-permissoes.png)
- [Studio celular](review-v093/mobile-studio.png) · [Studio desktop](review-v093/desktop-studio.png) · [Grade 3×3](review-v093/mobile-grade3.png)

Reprodução: npm run build; iniciar Chromium com --headless --no-sandbox --disable-dev-shm-usage --remote-debugging-port=9222 e perfil temporário. Servir via python3 -m http.server 5173 uma pasta temporária com algo-kids → dist, docs → docs e src → src. Executar node scripts/browser-smoke.mjs. Não instala bibliotecas, não publica e usa somente dados do perfil de teste. O script limpa/semeia a chave de progresso nesse perfil para testar bloqueios/reload; não deve ser apontado para perfil pessoal.

## Limitações e pendências

Chromium headless não comprova toque físico, Safari/iOS, leitor de tela ou experiência real com crianças. As capturas são amostragem representativa; os 71 cenários são auditados e testados por dados/DOM, não todos fotografados. Ainda revisar densidade de quatro objetos em uma célula e grades autorais grandes em aparelhos reais, contraste percebido, foco, rolagem e compreensão de prévia vs execução. Labels legíveis não certificam acessibilidade completa.

Progresso é conveniência local sem autenticação ou sincronização; limpar dados/bloquear storage pode perdê-lo. Não contém programa/histórico/identidade. As conquistas voláteis da V092 não podem ser recuperadas. Nenhum recurso escolar/V2.0 ou publicação automática de missão autoral foi antecipado. Revisão e merge continuam manuais pelo usuário.

## Inventário de arquivos modificados/adicionados

- `AGENTS.md`
- `README.md`
- `WORK_INSTRUCTIONS.md`
- `docs/ROADMAP.md`
- `docs/V092-boxes-for-example.json`
- `docs/V092-boxes-while-example.json`
- `docs/V092.md`
- `docs/V093-MAP-IDENTIFICATION-AUDIT.md`
- `docs/V093-VALIDATION.md`
- `docs/V093.md`
- `docs/review-v093/desktop-permissoes.png`
- `docs/review-v093/desktop-studio.png`
- `docs/review-v093/mobile-chaves-cinza.png`
- `docs/review-v093/mobile-descartado.png`
- `docs/review-v093/mobile-descarte-concluido.png`
- `docs/review-v093/mobile-grade3.png`
- `docs/review-v093/mobile-inicio.png`
- `docs/review-v093/mobile-lixeira-separada.png`
- `docs/review-v093/mobile-permissoes.png`
- `docs/review-v093/mobile-previa-quatro.png`
- `docs/review-v093/mobile-previa.png`
- `docs/review-v093/mobile-progresso.png`
- `docs/review-v093/mobile-quatro-chaves.png`
- `docs/review-v093/mobile-studio.png`
- `docs/review-v093/mobile-transportando.png`
- `docs/review-v093/report.json`
- `index.html`
- `package.json`
- `scripts/audit-map-identification.mjs`
- `scripts/browser-smoke.mjs`
- `src/command-view.js`
- `src/demo-missions-v092.js`
- `src/map-labels-v093.js`
- `src/mission-validation.js`
- `src/missions.js`
- `src/presentation/map-identification.js`
- `src/presentation/scene-view.js`
- `src/presentation/visual-resolver.js`
- `src/presentation/visual.css`
- `src/progress.js`
- `src/studio/authoring-schema.js`
- `src/style.css`
- `src/ui.js`
- `src/variant-preview.js`
- `src/view.js`
- `tests/fixtures/v092-ux-baseline.json`
- `tests/fixtures/v092-visible-labels.json`
- `tests/helpers/controllers.js`
- `tests/v08.test.js`
- `tests/v092.test.js`
- `tests/v093.test.js`
