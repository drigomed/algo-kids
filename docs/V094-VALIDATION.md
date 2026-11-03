# V0.9.4 — Validação

Base main `9dc4a76`, branch `feat/v094-execution-curriculum-interactions`. Escopo fechado em [V094-SCOPE.md](V094-SCOPE.md). Nenhum merge ou deploy executado.

## Resultados

| Verificação | Resultado |
|---|---|
| `npm test` na main antes das mudanças | 823 aprovados |
| `npm test` com V094 | **882 aprovados**, zero falhas, cancelamentos ou ignorados |
| `node --test tests/v094.test.js` | **60 aprovados** sobre o catálogo atual, motor, contratos e interfaces |
| `npm run build` | dist estático aprovado |
| `node scripts/validate-assets.js` | 91 SVGs / 61.397 bytes; arte preservada |
| `node scripts/validate-dist.js` | 153 arquivos / 312 referências compatíveis com `/algo-kids/` e Studio |
| `node scripts/audit-v094.mjs` | 32 missões / 68 cenários aprovados; três rotas fixas da 23 rejeitadas |
| `node scripts/browser-smoke-v094.mjs` | Chromium 154, zero exceções/recursos ausentes, 21 capturas reais |
| `node --check` em src/scripts/tests | Sintaxe válida |
| `git diff --check` | Sem erros |

## Cobertura

Cada uma das 32 missões atuais percorre validação, round-trip JSON, referência única nas variantes, simulação/passos determinísticos, sessões e playtest Studio. Contraprovas incluem comandos restantes (primitivas, decisões e laços), fechamento falso e orçamento de laços aninhados/while, ausência de autorização na 19, entrega errada na 23 inclusive A/B na Triagem, caso padrão para código Z, interação frontal rejeitada sem efeitos parciais e posição real em retirada/descarte.

Histórico com 2.021 registros não perde o primeiro; playtest conserva trace de 6.001 passos. Treino e testes de variantes são arquivados, reset/edição limpa a nova execução, prévia continua isolada. Query libera acesso sem conceder conquistas; progresso antigo ignora 28 e preserva o prefixo pelos IDs seguintes.

Os contratos curriculares V02–V093 usam a cópia congelada e identificada `tests/fixtures/v093-catalog.json`, extraída antes das mudanças. Continuam verificando o motor atual e a compatibilidade legada. As expectativas de vitória prematura da 05/loops e truncamento de trace foram ajustadas explicitamente para a regra nova. Helpers de congelamento evitam revisitar objetos já congelados no histórico acumulado. A suíte V094 e `engine.test.js` verificam o catálogo atual; não se usam snapshots históricos como prova de aprovação dos mapas novos.

## Revisão em navegador

Reprodução local: servir dist em `/algo-kids/` na porta 5174 e abrir Chromium com `--remote-debugging-port=9224`. O script usa CDP e controles reais do jogo/Studio; dados de teste e preenchimento automatizado não viram atalhos na aplicação.

- Desktop 1366×900, celular 390×844 e Studio 360×800; movimento reduzido.
- Rótulos sinal/passagem medidos sem interseção, mapas 14/15/17 e estado final da 27 registrados.
- 21 sem etiquetas das chaves, nomes acessíveis preservados; 23 com A/B/Triagem e retirada separada do robô.
- Referência 23 montada pelos controles e aprovada nas quatro variantes. Histórico exibe quatro execuções; vitória exploratória fora de ordem não escreve progresso.
- 19 observada inicialmente sem autorização; remover a ação causa falha de entrega; com autorização conclui.
- Paleta efetivamente oculta durante playback no jogo e Studio. Programa com 40 blocos: altura/scrollHeight 2.927 px, `overflow: visible`, sem limite de altura.
- 30 executa inspeção à frente, entrada na retirada, transporte e descarte na casa da lixeira.
- Studio valida 23 nas quatro variantes e mostra os quatro históricos.

[Relatório CDP](review-v094/report.json). Capturas: [13](review-v094/desktop-13-sinal.png), [15 alternativa](review-v094/desktop-15-ultima-variante.png), [19 sem autorização](review-v094/desktop-19-nao-autorizado.png), [23 desktop](review-v094/desktop-23.png), [23 celular](review-v094/mobile-23.png), [execução sem paleta](review-v094/desktop-execucao-sem-paleta.png), [histórico das variantes](review-v094/desktop-23-quatro-variantes.png), [Studio](review-v094/desktop-studio-23.png).

Capturas inspecionadas no navegador/headless e por leitura visual do artefato. Não equivalem a teste com criança, aparelho físico, Safari/iOS ou leitor de tela. A necessidade estrita de todas as decisões não é afirmada (17 aceita coletar sempre); rotas fixas testadas da 23 falham e todas as referências passam. Arte e workflow de publicação continuam existentes, sem dependências novas.
