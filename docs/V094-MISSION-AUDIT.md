# Auditoria curricular V0.9.4

Gerada por `node scripts/audit-v094.mjs`. Base V093: 9dc4a76, catálogo histórico congelado. **32 missões / 68 cenários, todas referências aprovadas.** Coordenadas 0-based, solução base única por missão. Energia: inicial / gasta / restante; custo não é otimizado.

A 28 foi removida; demais IDs preservados. Os 3 candidatos fixos derivados dos ramos da referência 23 falham em pelo menos uma variante; a AST ESCOLHA vence A/B/C/X. É contraprova dessas rotas, não busca exaustiva de todos programas.

## Cenários atuais

| Missão / variante | Início → meta | Resultado / instruções | Energia | Política |
|---|---|---|---|---|
| 1 · principal | (3,1) → (3,4) | won / 3 | — | Sem interação explícita |
| 2 · principal | (4,2) → (1,2) | won / 4 | — | Sem interação explícita |
| 3 · principal | (4,0) → (2,3) | won / 6 | — | Sem interação explícita |
| 4 · principal | (3,0) → (3,4) | won / 9 | — | Sem interação explícita |
| 5 · principal | (4,0) → (0,4) | won / 11 | — | Sem interação explícita |
| 6 · principal | (4,0) → (0,4) | won / 11 | — | Sem interação explícita |
| 7 · principal | (3,0) → (3,4) | won / 4 | — | Sem interação explícita |
| 8 · principal | (4,0) → (4,2) | won / 7 | 9 / 7 / 2 | Sem interação explícita |
| 9 · cima | (4,2) → (2,4) | won / 6 | — | Sem interação explícita |
| 9 · direita | (4,2) → (2,4) | won / 7 | — | Sem interação explícita |
| 10 · perto | (4,0) → (4,3) | won / 4 | — | Sem interação explícita |
| 10 · desvio | (4,0) → (4,3) | won / 9 | — | Sem interação explícita |
| 11 · direto | (4,2) → (2,4) | won / 7 | — | Sem interação explícita |
| 11 · lateral | (4,2) → (2,4) | won / 14 | — | Sem interação explícita |
| 11 · direita | (4,2) → (2,4) | won / 7 | — | Sem interação explícita |
| 12 · duplo | (4,0) → (4,3) | won / 4 | — | Sem interação explícita |
| 12 · simples | (4,0) → (4,3) | won / 9 | — | Sem interação explícita |
| 13 · verde | (4,2) → (2,4) | won / 6 | — | Sem interação explícita |
| 13 · vermelho | (4,2) → (2,4) | won / 7 | — | Sem interação explícita |
| 14 · perto | (4,0) → (4,3) | won / 4 | — | Sem interação explícita |
| 14 · desvio | (4,0) → (4,3) | won / 10 | — | Sem interação explícita |
| 15 · ativa | (4,0) → (4,3) | won / 4 | — | Sem interação explícita |
| 15 · inativa | (4,0) → (4,3) | won / 9 | — | Sem interação explícita |
| 16 · perto | (4,0) → (4,3) | won / 4 | 6 / 3 / 3 | Sem interação explícita |
| 16 · desvio | (4,0) → (4,3) | won / 9 | 6 / 5 / 1 | Sem interação explícita |
| 17 · vermelha | (4,0) → (0,4) | won / 14 | — | Sem interação explícita |
| 17 · azul | (4,0) → (0,4) | won / 18 | — | Sem interação explícita |
| 18 · principal | (4,0) → (4,4) | won / 5 | — | here |
| 19 · principal | (4,0) → (4,3) | won / 6 | — | here |
| 20 · leve | (2,0) → (2,4) | won / 11 | — | Sem interação explícita |
| 20 · maior | (2,0) → (2,4) | won / 11 | — | Sem interação explícita |
| 21 · vermelho | (2,0) → (2,4) | won / 19 | — | here |
| 21 · azul | (2,0) → (2,4) | won / 20 | — | here |
| 21 · verde | (2,0) → (2,4) | won / 20 | — | here |
| 22 · vermelho | (2,0) → (2,4) | won / 19 | — | here |
| 22 · azul | (2,0) → (2,4) | won / 19 | — | here |
| 22 · verde | (2,0) → (2,4) | won / 19 | — | here |
| 23 · A | (4,0) → (0,0) | won / 15 | — | here |
| 23 · B | (4,0) → (0,2) | won / 11 | — | here |
| 23 · C | (4,0) → (0,4) | won / 15 | — | here |
| 23 · X | (4,0) → (0,4) | won / 15 | — | here |
| 24 · leste | (4,0) → (3,4) | won / 11 | — | Sem interação explícita |
| 24 · norte | (4,4) → (0,3) | won / 11 | — | Sem interação explícita |
| 25 · curto | (4,0) → (3,2) | won / 7 | — | Sem interação explícita |
| 25 · longo | (4,0) → (3,3) | won / 9 | — | Sem interação explícita |
| 26 · vermelho-redonda | (2,0) → (2,4) | won / 21 | — | here |
| 26 · vermelho-quadrada | (2,0) → (2,4) | won / 21 | — | here |
| 26 · azul-redonda | (2,0) → (2,4) | won / 21 | — | here |
| 26 · azul-quadrada | (2,0) → (2,4) | won / 21 | — | here |
| 27 · permissoes3 | (2,1) → (2,4) | won / 5 | — | here |
| 27 · permissoes1 | (2,1) → (2,4) | won / 5 | — | here |
| 27 · permissoes2 | (2,1) → (2,4) | won / 6 | — | here |
| 27 · permissoes0 | (2,1) → (2,4) | won / 11 | — | here |
| 29 · cenario0 | (4,2) → (0,2) | won / 7 | — | here |
| 29 · cenario1 | (4,2) → (0,2) | won / 7 | — | here |
| 29 · cenario2 | (4,2) → (0,2) | won / 7 | — | here |
| 29 · cenario3 | (4,2) → (0,2) | won / 7 | — | here |
| 30 · caixas1 | (2,1) → (2,4) | won / 14 | — | here |
| 30 · caixas2 | (2,1) → (2,4) | won / 23 | — | here |
| 30 · caixas3 | (2,1) → (2,4) | won / 32 | — | here |
| 31 · caixas0 | (2,1) → (2,4) | won / 4 | — | here |
| 31 · caixas1 | (2,1) → (2,4) | won / 13 | — | here |
| 31 · caixas2 | (2,1) → (2,4) | won / 22 | — | here |
| 31 · caixas3 | (2,1) → (2,4) | won / 31 | — | here |
| 32 · horizontal | (4,0) → (4,4) | won / 14 | — | here |
| 32 · vertical | (4,4) → (0,4) | won / 14 | — | here |
| 33 · caixas1 | (2,1) → (2,4) | won / 13 | 20 / 18 / 2 | here |
| 33 · caixas2 | (2,1) → (2,4) | won / 22 | 32 / 30 / 2 | here |

## Diferenças de campos em relação à V093

A tabela inclui normalização declarativa de variantes e apresentação. Não implica novos mecanismos no motor. 13 muda CSS compartilhado; 32 só explicita a política here.

| Missão | Campos diferentes |
|---|---|
| 1 · Olá, estrela! | Nenhum |
| 2 · Uma nova direção | Nenhum |
| 3 · A curva do caminho | Nenhum |
| 4 · Pedra no caminho | Nenhum |
| 5 · Entre as rochas | solution |
| 6 · Grande expedição | Nenhum |
| 7 · Tesouros pelo caminho | Nenhum |
| 8 · Ainda falta um! | energy |
| 9 · Qual caminho está livre? | Nenhum |
| 10 · Já tenho o suficiente? | Nenhum |
| 11 · Uma decisão dentro da outra | Nenhum |
| 12 · Cada descoberta tem seu valor | Nenhum |
| 13 · O semáforo | Nenhum |
| 14 · A porta trancada | grid, solution, variants |
| 15 · A ponte misteriosa | instructions, hint, grid, initialVariables, entities, presentation, variants |
| 16 · Entrega especial | energy, variants |
| 17 · Qual é a cor? | instructions, hint, start, goal, initialVariables, grid, barriers, solution, presentation, entities, variants |
| 18 · Aperte o botão | instructions, entities, commandOptions, solution, interactionPolicy |
| 19 · Retirada e entrega | instructions, robotMemory, entities, commandOptions, winCondition, solution, presentation, interactionPolicy, completionGuard |
| 20 · Duas pontes, cargas diferentes | Nenhum |
| 21 · Observar e escolher um objeto | entities, commandOptions, presentation, instructions, solution, interactionPolicy, variants |
| 22 · As três chaves — ESCOLHA | entities, commandOptions, instructions, solution, interactionPolicy |
| 23 · Um pacote, três destinos | title, interactionPolicy, instructions, hint, start, goal, grid, initialVariables, entities, winCondition, commandOptions, switchOptions, solution, variants, presentation |
| 24 · Repita quatro vezes | Nenhum |
| 25 · Enquanto o caminho está livre | Nenhum |
| 26 · A chave tem cor e forma | entities, commandOptions, instructions, solution, interactionPolicy |
| 27 · Uma das duas permissões | initialVariables, interactionPolicy, variants |
| 29 · Duas etiquetas, duas escolhas | entities, barriers, solution, presentation, interactionPolicy, variants |
| 30 · Quantas caixas preciso retirar? | instructions, hint, grid, entities, barriers, commandOptions, solution, presentation, interactionPolicy, variants |
| 31 · Enquanto houver caixas | instructions, hint, grid, entities, barriers, commandOptions, solution, presentation, interactionPolicy, variants |
| 32 · Inspecionar, registrar, avançar | interactionPolicy |
| 33 · Descarte eficiente | instructions, hint, grid, entities, barriers, commandOptions, solution, presentation, interactionPolicy, variants |

## Revisões e limites

05 remove dois comandos pendentes da referência. 08 custa 7 de 9; 16 custa 3/5 de 6, com curvas gratuitas explícitas. 17 tem vermelho aberto e azul dependente de pacote no mesmo mapa; coletar sempre continua alternativa válida. 19 exige autorização inicial falsa tanto para entrega quanto para encerrar. Na 23, as estações são três pontos visíveis e as metas variam A/B/T/T; não há controle sobre o robô inicial. 27 materializa estado por variante antes de reordenar. 30/31/33 entram no ponto de retirada e na lixeira, com barreira depois da pilha; 33 mantém gasto 18/30.

Contratos antigos são testados com dados históricos identificados. Os positivos de todos os cenários atuais também percorrem JSON, incremental, sessões e Studio em tests/v094.test.js; os negativos verificam comandos extras, autorização, posição, rotas fixas e guardas. Não se afirma unicidade de soluções nem necessidade estrita de todas as decisões pedagógicas.
