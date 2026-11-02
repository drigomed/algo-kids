# V0.9.2 — Contratos incrementais

O formato permanece missão pura `mission-json/v1`. Rascunho continua `algo-kids-draft/v1`. Nenhum campo de escola, conta ou progresso é adicionado. Importação do jogo e Studio compartilham `mission-io` e `mission-validation`; autorização final pertence ao motor.

## REPITA de memória

O literal histórico permanece `{ "type":"for", "times":4, "body":[] }`, com inteiro 1–20 e autorização correspondente em `loopOptions`. Frames, estados e checks legados permanecem iguais.

O novo modo é opt-in:

```json
{
  "robotMemory":{"quantidadeObservada":{"type":"number","initial":null}},
  "loopOptions":[{
    "id":"observado","label":"Repetir a quantidade observada","kind":"for",
    "count":{"kind":"memoryVariable","name":"quantidadeObservada"}
  }],
  "solution":[{
    "type":"for","count":{"kind":"memoryVariable","name":"quantidadeObservada"},"body":[]
  }]
}
```

O trecho ilustra o contrato, não é uma missão completa. Exemplos completos testados: [REPITA](V092-boxes-for-example.json) e [ENQUANTO](V092-boxes-while-example.json).

- Exatamente um de `times` e `count`, tanto no preset como no nó. `count` aceita apenas as duas chaves `kind:'memoryVariable'` e `name`, referindo memória declarada `number`. Strings numéricas não são convertidas.
- Assinatura de autorização usa serialização canônica, independente da ordem das chaves; nomes, fontes e permissões devem corresponder entre variantes. Alterar a memória referida não é uma autorização equivalente.
- Na ativação, o interpretador lê uma vez, valida inteiro seguro **0–20** e congela em `frame.times`. Fonte fica em `frame.count`. Alterar a memória dentro do corpo não muda essa ativação; ativação seguinte lê novamente.
- Memória desconhecida: `actionFailed/memoryUnknown`. Quantidade negativa, fracionária, não finita ou >20: `actionFailed/loopCountInvalid`. Uma instrução tentada; nenhum efeito do corpo, energia ou frame ativo restante. Valores não finitos no documento são recusados antes de executar; testes de runtime injetam esses valores para verificar a defesa.
- Zero é conhecido e válido, produz um check falso e sai sem corpo. Não autoriza `times:0` nos JSON legados.
- Checks continuam contando no limite de instruções, inclusive o check final. São gratuitos em energia. Limite tem prioridade antes da leitura, como antes.
- `loopContext`, eventos `loopCheck`, trace e relatório do Studio incluem contagem resolvida e origem. `loopCounts` só aparece em relatórios de laços dinâmicos; não é exportado na missão.
- Pausa não executa; Interromper cancela; reset e variantes usam memória/bateria próprias. Frames são copiados, e o corpo não é alterado pelo contador.

No Studio, abrir **Regras → Repetições autorizadas → opção REPITA → Fonte da quantidade**. `literal` oferece `times`; `memory` oferece `count.name`. A troca pede confirmação e conserva os corpos da solução; se a autorização mudou, selecionar o novo preset no bloco para adequá-lo. Diagnósticos impedem exportar solução incompatível. Undo/redo restaura os dados. É possível escolher entre os presets fixo e observado da 30 pelo select do bloco, preservando o corpo.

## Pilha, posse e descarte: sem nova regra de objetos

`entity.properties.quantidade={stateVariable:'restantes'}` continua sendo propriedade vinculada genérica. Uma barreira na mesma casa consulta `restantes==0`. `interact front retirar` exige quantidade>=1 e mãos vazias; decrementa exatamente 1 e passa `carregando=true`. `interact here descartar` exige posse, zera-a e incrementa `descartadas`. `once:false/consume:false`: a entidade persiste e as ações são repetíveis.

A vitória exige destino, `restantes==0` e `carregando==false`. `usedInteractions`, memória e energia não vazam entre cenários. Falha de guarda/alcance não publica efeitos parciais nem cobra energia. Não há inventário móvel ou remoção de obstáculo estático.

## Visuais aditivos

Seis SVGs originais locais, sem substituir os 85 anteriores: quatro `reactive/shapekey_{redround,redsquare,blueround,bluesquare}`, `reactive/stack_idle`, `reactive/bin_idle`. Estão no registry fechado e na galeria existente. Estados desconhecidos usam fallback; URLs/SVG externo não são aceitos.

Vínculo opcional e genérico de contador gráfico:

```json
{"assetGroup":"stack","quantity":{"source":"property","name":"quantidade","empty":"hideImage"}}
```

`source` é `property` ou `variable`; `name` é um identificador válido. `empty` opcional é `show` (padrão) ou `hideImage`. Inteiro observado 0–10.000 aparece como badge/rótulo acessível; dado inválido não gera número enganoso. Zero com hideImage oculta a arte sólida, mantém “Vazio · 0”; show conserva a lixeira vazia. Não há acesso a nomes especiais no resolvedor. Todos os campos são editáveis por formulários e validados no importador compartilhado. Movimento reduzido e o registry seguro permanecem.

## Compatibilidade e exemplos

Round-trip preserva AST, variantes e tipos estritos (`0`, `false`, `null`, `''`). O Studio não resolve `count` e não o converte para `times` na exportação. Draft parcial pode manter count inválido para edição, mas não contorna a validação do jogo. Exemplos antigos continuam válidos. Energia permanece opcional sem novas formas de recarga, ranking ou cálculo de ótimo.
