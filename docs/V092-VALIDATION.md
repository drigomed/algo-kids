# V0.9.2 — Validação da entrega

Base: main 05eccf602b6a88024385e8b9b1a11833c2066959. Branch feat/v092-curriculum-decisions-loops. Sem merge automático, deploy manual ou mudança na infraestrutura de publicação.

## Resultados locais reais

| Comando | Resultado |
|---|---|
| npm test | **751 testes aprovados**, zero falhas/cancelamentos/ignorados |
| npm run build | Artefato estático criado em dist |
| node scripts/validate-assets.js | **91 SVGs, 61.397 bytes**; dialeto seguro e whitelist fechada |
| node scripts/validate-dist.js | **147 arquivos, 289 referências** compatíveis com /algo-kids/ e /algo-kids/studio/ |
| node scripts/audit-missions.js | **33 missões, 71 cenários**; todas as referências vencem suas variantes |
| node scripts/generate-art.mjs | Gera 91 SVGs/galeria; hashes dos 85 legados continuam idênticos |
| node --check sobre src/scripts/tests | Sem erros de sintaxe |
| git diff --check | Sem erros |
| node scripts/browser-smoke.mjs | **10 verificações em Chromium 154, zero exceções/recursos ausentes** |

Antes das mudanças, npm test na main V0.9.1 passou 565 testes. As suites existentes que iteram o catálogo também passaram a exercitar as novas missões. A nova suíte V092 tem 69 testes específicos (incluindo a defesa de relatório após truncar trace longo); o total geral inclui essas suites expandidas. Consulte testes e resultados, não apenas a contagem.

## Regressões e contraprovas

- 01–08: definições integrais e todos os estados simulados iguais aos da baseline V0.9.1. 09–19, 23 e 25 igualmente preservadas. 85 SVGs anteriores verificados por SHA-256 byte a byte.
- 20: comparação estrutural permite somente remoção de autorização/memória/rótulo de inspeção e texto associado; mapas, física, variantes e solução iguais. Rotas fixas A/B falham na outra carga.
- 21/22: geografia/AST autorizadas pela spec, (2,3) livre, inspeção de barrierProperty somente em alcance válido; escolha sem observação, cor errada e porta fechada falham. Nenhuma dependência solution[0] entre missões.
- 24: definição sem variants e trace original preservados; segundo cenário norte vence com a mesma AST literal.
- 26–29: mesma AST vence quatro combinações por missão; testes de escolhas/omissões incorretas e curto-circuito do OU inclusivo.
- 30/31/33: pilha e lixeira são entidades reais; passagem bloqueia até zero, duas interações espaciais distintas, posse e descarte atômicos, negativos e isolamento entre variantes. Energia insuficiente não publica descarte.
- 32: corpo composto, três estações necessárias, variantes horizontal/vertical e contraprova de desvio que só funciona na primeira. Repetir duas vezes não satisfaz a vitória.
- for.count: 0/1/2/3/20, desconhecido, inválidos/NaN/infinito, snapshot congelado, próxima ativação, autorização canônica, tipo numérico, conflito times/count, profundidade/nós, limite, stop e energia; step/simulate/sessão/playtest/importação equivalentes.
- UI: controladores reais com DOM mínimo montam REPITA dinâmico e ESCOLHA de quatro casos; JSON/draft round-trip, edição da fonte e do nome, confirmação, cancelamento, undo/redo, preservação do corpo e playtest de variantes.
- Os ajustes estritamente necessários aos testes antigos estão explicados em V092.md. Baselines antigas não foram apagadas ou sobrescritas.

## Revisão real de navegador

Capturas em [review-v092](review-v092/report.json), feitas sobre o dist servido localmente com prefixo /algo-kids/, sem publicação externa. Chromium headless 154, movimento reduzido, viewports **390×844**, **360×800** e **1366×900**.

O roteiro usa os controles reais: importa missão 30 no jogo, monta inspeção/REPITA/retirada/descarte/movimentos, vence treino e duas variantes; importa no Studio e vence os três cenários; troca fonte literal/memória e desfaz. Verifica ausência de overflow horizontal nos pontos amostrados, quatro chaves em posições gráficas distintas, cinza e galeria com os 91 recursos carregados. A revisão visual identificou a sobreposição herdada de grid-area nas entidades coexistentes; a correção só afeta stacks de entidades, ausentes das primeiras oito missões. Pilha vazia oculta o desenho sólido, lixeira vazia continua aparecendo.

Capturas principais: [Pilha](review-v092/mobile-pilha.png), [Descarte](review-v092/mobile-descarte.png), [Quatro chaves](review-v092/mobile-quatro-chaves.png), [Cinza](review-v092/mobile-chaves-cinza.png), [Studio](review-v092/mobile-studio.png), [Relatório](review-v092/mobile-relatorio.png), [Galeria](review-v092/gallery-v092.png). Há também screenshots do jogo 01, programa e desktop.

Para reproduzir, iniciar Chromium com --headless --no-sandbox --disable-dev-shm-usage --remote-debugging-port=9222 e perfil temporário. Servir uma pasta temporária contendo algo-kids → dist, docs → docs e src → src (links locais), via python3 -m http.server 5173 --directory PASTA. Executar node scripts/browser-smoke.mjs. O script só usa CDP/WebSocket nativo do Node, sem instalar dependências nem alterar o jogo; requer os processos locais já iniciados. O fluxo não faz parte obrigatória do CI sem navegador.

## Limitações e revisão humana

Amostragem visual representativa; não afirma revisão de todas as missões em todos os tamanhos. Chromium headless não representa toque físico, leitor de tela, Safari/iOS ou experiência infantil. A legibilidade das quatro chaves em uma célula pequena e a densidade do Studio devem ser aprovadas em aparelho real. Auditoria de candidatos linearizados não prova unicidade ou necessidade absoluta de todos os comandos; laços fixos podem ser legitimamente expandidos. Não há resolvedor de ótimo. Demais pendências pedagógicas estão no roadmap V1.0; V2.0 continua apenas planejamento. Revisão e merge pertencem ao usuário.

## Arquivos modificados/adicionados

- `AGENTS.md`
- `README.md`
- `WORK_INSTRUCTIONS.md`
- `docs/ROADMAP.md`
- `docs/V08-GALLERY.html`
- `docs/V091.md`
- `docs/V092-JSON-CONTRACT.md`
- `docs/V092-MISSION-AUDIT.md`
- `docs/V092-VALIDATION.md`
- `docs/V092-boxes-for-example.json`
- `docs/V092-boxes-while-example.json`
- `docs/V092.md`
- `docs/review-v092/desktop-jogo.png`
- `docs/review-v092/desktop-studio.png`
- `docs/review-v092/gallery-v092.png`
- `docs/review-v092/mobile-chaves-cinza.png`
- `docs/review-v092/mobile-descarte.png`
- `docs/review-v092/mobile-for.png`
- `docs/review-v092/mobile-missao01.png`
- `docs/review-v092/mobile-pilha.png`
- `docs/review-v092/mobile-quatro-chaves.png`
- `docs/review-v092/mobile-relatorio.png`
- `docs/review-v092/mobile-studio.png`
- `docs/review-v092/report.json`
- `package.json`
- `scripts/audit-missions.js`
- `scripts/browser-smoke.mjs`
- `scripts/curriculum-probes.js`
- `scripts/generate-art.mjs`
- `scripts/validate-assets.js`
- `src/assets/reactive/bin_idle.svg`
- `src/assets/reactive/shapekey_blueround.svg`
- `src/assets/reactive/shapekey_bluesquare.svg`
- `src/assets/reactive/shapekey_redround.svg`
- `src/assets/reactive/shapekey_redsquare.svg`
- `src/assets/reactive/stack_idle.svg`
- `src/command-view.js`
- `src/demo-missions-v05.js`
- `src/demo-missions-v06.js`
- `src/demo-missions-v07.js`
- `src/demo-missions-v092.js`
- `src/interpreter.js`
- `src/lock-mission-data.js`
- `src/loop-view.js`
- `src/loops.js`
- `src/mission-validation.js`
- `src/missions.js`
- `src/presentation/asset-registry.js`
- `src/presentation/scene-view.js`
- `src/presentation/visual-resolver.js`
- `src/presentation/visual.css`
- `src/studio/app.js`
- `src/studio/authoring-schema.js`
- `src/studio/inspectors.js`
- `src/studio/playtest.js`
- `tests/fixtures/v091-asset-digests.json`
- `tests/fixtures/v091-curriculum-baseline.json`
- `tests/helpers/controllers.js`
- `tests/v05.test.js`
- `tests/v06.test.js`
- `tests/v07.test.js`
- `tests/v08.test.js`
- `tests/v09.test.js`
- `tests/v091.test.js`
- `tests/v092.test.js`
