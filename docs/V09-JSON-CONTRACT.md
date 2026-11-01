# mission-json/v1 — contrato de troca V0.9

O arquivo padrão é **o objeto de missão puro**, compatível com validateMission/validateProgram do motor. Não contém status editorial, resultado do teste, históricos de execução, escola, turma, autor institucional ou identidade de usuário. Esses dados pertencem futuramente a um envelope do backend, não às regras da missão.

## Formas aceitas

- Padrão de exportação: `{id,title,instructions,hint?,grid,start,goal,solution,...}`.
- Envelope alternativo de entrada: `{"format":"mission-json","version":1,"mission":{...}}`, com somente essas três chaves. Versões desconhecidas e envelopes misturados com campos de missão são rejeitados.
- Rascunho local: envelope **diferente**, interno ao localStorage, `algo-kids-draft` versão 1. Não é exportado como missão e pode conter dados incompletos. Na V0.9.1, o mesmo envelope exato pode ser importado/exportado como `.akdraft.json`, independentemente de validade de runtime; não é aceito pelo importador do jogo.

Arquivo completo de referência: [V09-example.json](V09-example.json). Os testes o reproduzem a partir dos handlers reais dos formulários e comparam o documento integralmente.

## Campos de runtime

Identidade/texto: id (string ou número, sem substituição do catálogo), title, instructions, hint opcional, demo opcional. Objetos legados válidos podem omitir instructions; o Studio preserva a ausência e oferece adicionar o campo, sem migração silenciosa.

Mundo: grid completo (width/height/obstacles/cells), start (row/col/direction), goal, initialVariables, robotMemory, entities, barriers, winCondition e `energy` opcional (V0.9.1: initial e os seis costs completos).

Autorização e programa: commandOptions, conditionOptions, switchOptions, loopOptions, solution. Os contratos dos nós, guardas, operandos, limites e autorização são os do motor existente; não há AST nova.

Variação/aparência: variants e presentation, incluindo metadados visuais V0.8. O Studio rejeita campos de runtime desconhecidos e metadados administrativos como schoolId/status. Não adiciona metadados internos ao exportar.

### Tipos e ordem

0, false, texto vazio e null de memória desconhecida não são tratados como ausentes. Números precisam ser finitos e não são convertidos a partir de strings no importador. O formulário tem controles explícitos de tipo; um valor incompatível produz diagnóstico, não coerção silenciosa. Propriedade vinculada continua sendo `{stateVariable:"nome"}`, não uma cópia do valor atual.

Exportação usa JSON.stringify sobre dados estruturados, indentação de dois espaços e chaves de objetos ordenadas. Arrays preservam integralmente a ordem (casos, comandos, efeitos, variantes). Reimportação/reexportação é determinística; igualdade semântica do selo não depende da ordem de chaves.

### Variantes

O motor aplica substituição superficial: `{...base,...variant}`. O Studio respeita isso: editar grid herdado materializa **todo o grid** na variante; nunca exporta fragmento ou faz deep merge. Retornar à herança remove a chave do override. O programa de referência é único, validado em todos os cenários resolvidos. IDs/rótulos de variante permanecem no documento.

## Fronteira de entrada

1. Arquivo local .json, até **1 MiB**, verificado antes da leitura/parse; parseMission também limita bytes UTF-8 antes de JSON.parse.
2. assertJsonData e a validação de missão rejeitam raízes incompatíveis, funções/getters/ciclos em APIs de dados, protótipos perigosos, listas esparsas, chaves inseguras e excesso de profundidade/contagem. JSON importado nunca é executado.
3. Metadados do contrato e configuração visual são verificados na fronteira do Studio. Apenas grupos/temas/skins/estados conhecidos; nenhuma URL/path/SVG/HTML executável pode virar recurso visual.
4. validateMission e validadores existentes verificam física, dados, memória, efeitos, interações e autorização. validateProgram verifica a mesma solution para todas as variantes resolvidas.
5. Erros impedem a substituição do draft. Uma importação válida ainda pede confirmação antes de substituir o rascunho atual.

Texto contendo tags é **texto**, exibido escapado/textContent; não cria HTML ou script. URLs em campos de recursos visuais são rejeitadas. Não há upload de sprites ou código customizado.

A interface admite criação/redimensionamento de 3 a 12 células por eixo. Importa cenários menores compatíveis com o motor, mas rejeita dimensões acima de 12 por segurança da prévia. Esse é limite do Studio, não alteração da engine. Redução com itens externos exige confirmação de remoção/remapeamento; conflitos restantes continuam sendo diagnosticados.

## Exportação e significados

- **Estruturalmente válida:** passou na validação de missão e programa. Pode conter um algoritmo que colide ou falha em runtime; isso é permitido pelo motor.
- **Solução validada nas variantes atuais:** aquele programa venceu todos os cenários daquela versão do conteúdo. Não prova unicidade, justiça ou qualidade pedagógica.
- **Pronta pedagogicamente:** exige revisão humana, fora do selo automático.

Exportar missão válida sem solução testada é permitido após aviso explícito. Solução vazia gera alerta e não pode receber selo. Alteração de qualquer dado invalida o resultado anterior; testes não são embutidos no JSON. Download usa Blob application/json, nome sanitizado, URL temporária revogada e nenhuma requisição de rede.

O limite de 1 MiB também é aplicado à exportação formatada para garantir reimportação. Salvar rascunho local incompleto não equivale a exportar missão válida.

## Compatibilidade e provas

Exemplos V04/V05/V06/V07 e missões 01–25 continuam objetos válidos. Casos com memória, inspeção, interações, restrições físicas, if/switch/for/while e variantes são reimportados e executados nos testes, sem migração. Metadados visuais antigos glyph/labels permanecem preservados; aparências por ID do catálogo continuam disponíveis. Abrir um modelo pelo Studio gera ID de cópia e materializa sua aparência V0.8 para ela permanecer portátil.

Fluxo comprovado: criar por formulário → validar → testar → exportar → importar em outro draft → validar/testar novamente. Comparação estrutural, tipos, permissões, cenário e AST são preservados. Mudança futura de schema precisa de versão externa explícita e migração documentada; não reinterpretar silenciosamente documentos v1.

## Extensão V0.9.1

Ver [V091.md](V091.md): energia é campo opcional de missão, sem alterar a ausência histórica. Cada variante substitui energy inteiro. Exportação pura continua válida e compartilhada com o importador do jogo; draft usa envelope próprio e não pode contornar a validação. Não inclui saldo runtime ou resultados no JSON.
