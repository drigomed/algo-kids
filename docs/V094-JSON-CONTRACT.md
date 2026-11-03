# V094 — Contratos incrementais

Formato permanece `mission-json/v1` (missão pura) e `algo-kids-draft/v1` (rascunho). Mesmos nós de AST e tipos de memória/condições/efeitos. Sem JavaScript livre ou IDs conhecidos pelo motor.

## Interação

Campo raiz opcional `interactionPolicy: "here"`: validador exige todos os comandos `interact.relativeTo` e alcances das ações como here, inclusive variantes. Todas as missões oficiais interativas declaram a política; novas missões do Studio também. Posição é verificada em runtime e falhas continuam atômicas.

JSON legado que omite a política preserva `front`/`here` declarados: importação não reescreve dados, trajetos ou AST silenciosamente. O Studio mantém esses alcances editáveis para compatibilidade; a política here pode ser explicitamente removida em autoria legada. Isso não habilita interação frontal em nenhuma missão oficial V094. Inspeção tem alcance próprio e pode continuar front.

## Guarda de encerramento

Campo raiz opcional:

```json
{"completionGuard":{"condition":{"type":"memoryEquals","variable":"confirmar","value":true},"reason":"authorizationRequired"}}
```

Usa as condições genéricas existentes, valida declarações e motivo. Ao terminar ou vencer, condição falsa resulta em `actionFailed`/motivo configurado; memória desconhecida conserva erro tipado. Na 19, `confirmar` é boolean com `initial: false`; apresentação traduz para “Não autorizado”/“Autorizado”. A entrega também tem guarda, para não publicar efeitos de uma entrega não autorizada.

## Conclusão e histórico de execução

`applyCommand` continua operando uma primitiva sem conhecer o programa inteiro. `createExecution`/`stepExecution`/`simulate`, sessões e playtest reconciliam meta com os frames AST. `commandsRemaining` é falha de execução; o último comando válido mantém posição/efeitos/custo, sem o evento de vitória. Checks falsos finais são contabilizados; checks verdadeiros com novo corpo pendente falham. Limite pode impedir terminar checks finais e não conceder vitória.

Execução ganha `calculationHistory`, lista imutável de registros `{instruction,path,status,row,col,direction,events}`. Todos os eventos são copiados. Não entra na assinatura semântica de detecção de ciclos, no JSON da missão, no progresso nem em `robotMemory`. Sessões arquivam execuções anteriores em `executionArchives`. Studio conserva também seu trace inteiro e agrega histórico de todos os cenários. Reset/edição inicia nova execução.

## Catálogo e progresso

Variantes continuam overrides superficiais completos, avaliadas com uma única solução base. Na 23, goal varia por cenário; A/B/C/X são strings. A retirada calcula foraDosCasos por efeitos guardados existentes (inicia true e passa a false para A/B); Triagem exige esse flag. Assim qualquer outro código é aceito, sem novo operador de condição nem entrega indevida de A/B seguida de caminhada até a meta. Na 27, o estado inicial de cada variante é explícito para não herdar acidentalmente Sim/Sim após a reordenação.

O catálogo não contém 28; IDs restantes não mudam. `algo-kids-progress/v1` continua usando prefixo dos IDs no catálogo atual, ignorando a antiga 28. `unlockAll=1` é somente acesso na interface, sem mudar JSON, física, validação ou prova de conclusão.
