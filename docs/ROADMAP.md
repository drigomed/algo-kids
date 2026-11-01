# Roadmap orientado por missões

As fases a seguir são incrementais. Só avançar após validar a fase anterior na prática.

## V0.1 — O primeiro algoritmo (sequência)

**Mecânica:** grade 5x5 ou 6x6; robô com direção; comandos `avançar`, `virar à esquerda`, `virar à direita`; programar, executar, pausar e reiniciar; destaque visual do passo. Missões curtas com caminhos variados. Ensinar que a ordem importa.

**Missão exemplo:** 'O robô precisa alcançar a estação de recarga. Programe os passos antes de apertar Executar.'

**Avaliação:** não deve ser possível avançar para fora do tabuleiro; um caminho bloqueado resulta em erro compreensível e possibilidade de corrigir o programa.

## V0.2 — Coleta e decisões (escopo atualizado)

A diretriz atual prioriza entidades genéricas, coleta, estado e `if/else`, com missões 07–12 e variantes determinísticas. Consulte [V02.md](V02.md) para o contrato e os critérios de aceite. As seis missões V0.1 continuam disponíveis.

## V0.3 — O mundo reage ao robô

Sensores ambientais à frente, igualdade estrita de estado, passagens dinâmicas e efeitos condicionais genéricos. Missões 13–16 com variantes determinísticas e perguntas guiadas; contratos e aceite em [V03.md](V03.md). Preserva 01–12, sem implementar repetição ou alterar publicação.

## V0.4 — Interação, memória e variáveis

Prioridade no mecanismo: inspect, setMemory, memoryEquals e interact com autorização declarativa, memória tipada independente do mundo, transações e melhorias do editor móvel. Preserva 01–16; os cenários 17–19 são demonstrações de contratos, não expansão do conteúdo. Consulte [V04.md](V04.md). Sem switch, for ou while.

## Decisões — contempladas na V0.2

**Mecânica:** sensor booleano `caminhoLivreÀFrente`; blocos `Se... Senão...`. Criar cenários variáveis com posições de obstáculos distintas. Mesma solução deve passar nos cenários definidos.

**Missão exemplo:** 'O túnel tem uma porta que às vezes está fechada. Se estiver livre, avance; senão, contorne.' O cenário muda entre testes, tornando necessária uma decisão.

**Avaliação:** a missão não pode premiar um programa que só funciona na disposição visual inicial da porta.

## V0.5 — Restrições físicas e alvos observáveis

Comparações numéricas genéricas, propriedades de entidades/barreiras, passagem física avaliada em runtime e seleção explícita de alvo. As únicas demos novas (20–21) validam contratos; 01–19 ficam preservadas. O editor permite tentativas proibidas, que falham durante a execução. Consulte [V05.md](V05.md).

## V0.6 — ESCOLHA e editor visual

Switch/case/default nativo com seleção estrita, snapshot de memória/mundo, retorno ao pai e autorização declarativa. Editor compartilha controles de casos e SE, mantém caminho selecionado e protege contra descarte silencioso. Demos 22–23 validam três alternativas e padrão vencedor; 01–21 permanecem intactas. Contratos e aceite em [V06.md](V06.md). Sem repetição, mapas ou alteração de publicação.

## V0.7 — REPITA e ENQUANTO nativos

For contado e while com reavaliação antes de cada iteração, frames de controle sem expansão, checks incluídos no orçamento e autorização opt-in por loopOptions. Editor compartilha o ramo CORPO, mantém seleção e protege comandos ao reconfigurar. Somente as fixtures 24–25 foram adicionadas; 01–23 permanecem preservadas, especialmente a experiência de locomoção 01–06. Contratos, exemplo e resultados em [V07.md](V07.md). Entrega em PR para revisão, sem merge/deploy manual; validação visual no celular permanece pendente. Sem detector de ausência de progresso, break/continue, iterador local, currículo novo ou mudanças de publicação.

## V0.7.1 — Recuperação e execução segura

Correção incremental: detecção determinística de while por repetição de estado semântico, janela FIFO por ativação e botão contextual Interromper, distinto de pausa/reset. Cancelamento invalida timers e avanços entre variantes, preservando estado e vitórias anteriores. Mantém 01–25 sem mudanças e não amplia currículo. Contratos, resultados e limitações em [V071.md](V071.md).

## V0.8 — Identidade visual e sprites

Biblioteca de 85 SVGs originais, MK1–MK4, cinco temas independentes, resolvedor declarativo e feedback visual evidente. Mantém motor V0.7.1 e missões 01–25; acrescenta somente apresentação, galeria e validação segura de SVG no build. Consulte [V08.md](V08.md) e a [galeria local](V08-GALLERY.html). Revisão estética no celular pendente; sem merge/deploy manual.

## V0.9 — Studio de Missões

Editor visual separado em `/algo-kids/studio/`: mapas, entidades, barreiras/sensores, variáveis/memória, efeitos/interações, condições, comandos e estruturas autorizadas, variantes por substituição superficial e aparência V0.8. Solução de referência e playtest pelo mesmo motor, importação/exportação JSON puro e rascunho local. Sem login/backend/escolas ou publicação automática. Contratos e limites em [V09.md](V09.md) e [mission-json/v1](V09-JSON-CONTRACT.md).

## V1.0 — Produto educativo local consolidado (planejamento)

Organizar currículo definitivo em capítulos, progressão clara, revisão acompanhada com crianças, ajuda contextual, acessibilidade e UX mobile. Consolidar experiência do jogador e progresso local sem dados pessoais. O Studio permanece separado; demos técnicas não viram currículo sem revisão. Preparar convenções de versão/compatibilidade para conteúdo futuro, sem backend institucional nesta fase.

## V2.0 — Plataforma educacional multi-escola (visão futura)

Gestão central de níveis, escolas, usuários/papéis, administradores, instrutores, alunos, turmas e matrículas; vínculos aluno–turma–instrutor, atribuições de missões/trilhas e acompanhamento por aluno/turma/escola. Exige backend, autenticação, autorização por perfil/tenant/turma, níveis imutáveis versionados, auditoria, definições de progresso e privacidade infantil.

O JSON atual será conteúdo de LevelVersion; metadados escolares/autorais ficam no envelope do backend, não na física/condições. Planejar governança e descobrir necessidades com instituições antes de escolher banco/cloud/framework ou cobrança. **Nada disso foi implementado na V0.9.**

Ver [V20-PLATFORM-VISION.md](V20-PLATFORM-VISION.md) para papéis, modelo conceitual, fluxo editorial, atribuições, indicadores, transferências, segurança e etapas candidatas V2.0-A (fundação/identidade), B (turmas/matrículas/catálogo), C (atribuições/tentativas) e D (painéis/relatórios).

## Futuro (não prometer no MVP)

- Feedback sonoro opcional (arte, acessórios e microanimações disponíveis na V0.8).
- Editor em blocos aninhados com drag & drop adaptado ao toque.
- Visualização de pseudocódigo ou JavaScript.
- Integração institucional do Studio somente no planejamento V2.0 (o criador local existe na V0.9).
- PWA offline e instalação na tela inicial.
