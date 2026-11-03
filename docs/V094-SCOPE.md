# V0.9.4 — Escopo fechado

Autorizado pelo usuário em 03/11/2026: “fecha o escopo e pode implementar tudo da 0.9.4”. Consolida as duas rodadas de revisão sobre a V093 e substitui as restrições de preservação anteriores somente nos pontos abaixo. Base de implementação: main `9dc4a76`.

| Área | Entrega e aceite |
|---|---|
| Conclusão | Chegar à meta com comandos pendentes falha; somente checks finais falsos podem encerrar laços antes da vitória. Sem executar efeitos dos comandos restantes. |
| Memória de cálculo | Preservar todas as avaliações e resultados da execução, incluindo versões já testadas; painel consultável no jogo e Studio. Reiniciar/editar inicia outra execução. |
| Layout | Esconder paleta durante playback; mostrar novamente ao pausar/terminar. Algoritmo cresce com a página, sem scroll interno. |
| Acesso | `?unlockAll=1` libera acesso às missões sem conceder conquistas nem alterar o prefixo salvo. |
| 08 | Energia inicial 9; explicitar custos e verificar referência. |
| 13 | Separar identificações do sinal e da passagem. |
| 14 | Cercar as duas rotas com caixas, conforme referência da conversa. |
| 15 | Cercar rotas; segunda placa abre ponte uma casa acima da primeira. |
| 16 | Remover todas as caixas da variante 2; energia 6 nas duas. |
| 17 | Mesma geometria nas duas versões; vermelho começa com ponte aberta, azul só abre após coletar um pacote. |
| 19 | Ação “Obter autorização de entrega”; valor inicial “Não autorizado”; terminar sem autorização falha. Mantém o exercício de retirada/entrega. |
| 21 | Remover somente badges visíveis das chaves; preservar nomes acessíveis. |
| 23 | Mapa de três caminhos do print; estações A/B/Triagem visíveis; retirada fora do início do robô; códigos A/B/C/X; goals A/B/T/T; uma AST ESCOLHA vence todas, rota fixa falha em pelo menos uma. |
| 27 | Ordem Sim/Sim, Sim/Não, Não/Sim, Não/Não; desvio fechado se houver A ou B e aberto somente no último cenário. |
| 28 | Remover do catálogo, sem renumerar IDs seguintes. |
| 29 | Triagem na segunda e portão na terceira casa, contando de baixo para cima no corredor. |
| Interações | Todas as missões oficiais interagem somente na própria casa. Revisar trajetos, textos e permissões; inspecionar à frente continua possível. |

As imagens originais permanecem na conversa. As capturas em `review-v094/` documentam a implementação, não são cópias dos prints originais.

Decisões de implementação: encerramento imediato tipado `commandsRemaining`; política declarativa `interactionPolicy: "here"`; JSON histórico sem política preserva os alcances declarados; novas missões do Studio começam com política here. Pilha tem ponto de retirada acessível e barreira na casa seguinte. Nenhuma exceção por ID no motor, novo nó AST, backend, arte ou dependência.

A referência 05 tinha dois comandos depois de já vencer na V093: removidos para cumprir a regra geral de conclusão. Mundo e movimentos anteriores à chegada continuam iguais. Este é o único ajuste adicional necessário nas primeiras missões além da energia 08.

Sem merge automático ou deploy. V2.0 continua planejamento.
