# V2.0 — Visão da plataforma educacional multi-escola

**Planejamento, não implementação V0.9.** O Studio atual é estático/local e público no Pages. Não há conta, login, escola, aluno, turma, matrícula, servidor ou progresso remoto. Não escolher nesta fase banco, provedor de cloud, framework de backend ou cobrança: requisitos dependem de descoberta com instituições, escala e governança.

## Objetivo e separação de responsabilidades

Evoluir o produto local para plataforma com gestão central de níveis, escolas, usuários/papéis, instrutores, alunos, turmas, matrículas, distribuição de missões e acompanhamento por aluno/turma/escola. Motor declarativo e Studio continuam compartilhados; a plataforma fornece identidade, autorização, persistência e operação segura.

O JSON mission-json/v1 é o **conteúdo executável de uma LevelVersion imutável**. Escola, autor, escopo, revisão, publicação, atribuição e permissões ficam no envelope/persistência do backend, nunca nas condições/física do motor. O servidor validará novamente missão e programa; validação do navegador não é fronteira de confiança.

## Papéis e escopos

| Papel | Responsabilidade e limite |
|---|---|
| Operador global | Provisionar/ativar/suspender escolas, suporte e configurações. Acesso de suporte a dados de alunos deve ser restrito, justificado e auditável; não é acesso indiscriminado. |
| Administrador escolar | Cadastro da própria escola; convidar/desativar usuários; papéis permitidos; instrutores, turmas, vínculos e disponibilidade de capítulos; indicadores da sua escola. |
| Instrutor | Autoria/revisão de níveis conforme permissão, turmas vinculadas, atribuições e acompanhamento de alunos autorizados; compartilhamento interno sujeito a política. |
| Aluno | Missões/capítulos atribuídos, programação e feedback; somente o próprio avanço. Sem relatório de colegas ou gestão institucional. Identidade/recuperação devem ser adequadas a menores. |

Papéis são por escola, não globais por engano. Uma escola tem muitos usuários/turmas. Turma pode ter vários instrutores e instrutor várias turmas (N:N). Aluno pode ter várias matrículas ao longo do tempo, com datas/situação e histórico. Transferências precisam preservar histórico sem vazar dados de escola/turma anterior.

## Modelo conceitual candidato

Nenhuma tabela/API foi criada agora.

| Entidade | Papel |
|---|---|
| School | Tenant/escola, situação e configurações |
| User / Identity | Identidade e credenciais geridas com segurança |
| SchoolMembership | Associação usuário–escola e papéis autorizados |
| Class | Turma, período/ano e situação |
| ClassInstructor | Vínculo N:N instrutor–turma |
| Enrollment | Matrícula aluno–turma com período e estado |
| Level | Identidade estável do conteúdo |
| LevelVersion | JSON imutável, autoria, revisão e publicação |
| LevelAssignment | Versão/trilha atribuída a turma ou aluno conforme política |
| Attempt | Execução intencional vinculada a aluno e versão exata |
| Progress | Visão derivada/agregada de tentativas e conclusão |
| AuditEvent | Mudanças administrativas, acessos e publicação/atribuição |

## Gestão de níveis e fluxo editorial

Estados candidatos: **rascunho → em revisão → publicado → arquivado**. Instrutor edita um draft; publicar cria versão imutável. Atualizar conteúdo não sobrescreve a versão já atribuída ou usada em tentativas históricas. Atribuições precisam indicar versão/capítulo/trilha explicitamente e definir política para novas versões.

Biblioteca pode ter escopo pessoal, escolar ou catálogo global revisado. Compartilhamento entre escolas exige política explícita. Importação/exportação local permanece como portabilidade, sujeita à autorização e validação de servidor quando integrada. Gestão central de conteúdo não permite regras que dependam de escola ou nome de aluno na engine.

## Atribuições e acompanhamento pedagógico

Instrutor verá turmas/alunos autorizados, níveis/trilhas atribuídos, prazos orientativos e status não iniciado/em andamento/concluído/precisa de ajuda (a definir sem estigmatizar). Tentativas, última atividade, variantes concluídas, temas trabalhados e dificuldades como colisão/estagnação precisam de contexto, não rótulos de capacidade da criança.

Administrador terá contagem de turmas/alunos/instrutores ativos, progresso por turma/capítulo/escola/período e cobertura das atribuições. Exportações de relatórios serão controladas/auditadas, sem acesso cruzado a escolas. Evitar rankings públicos e incentivos manipulativos.

Definições analíticas a fechar:

- Tentativa é execução intencional; distinguir pausa, interrupção voluntária, falha, variante concluída e missão inteira concluída.
- Conclusão usa os critérios reais do motor para a **versão exata** do nível, incluindo todas as variantes exigidas.
- Progresso deriva de tentativas/eventos persistidos e versionados; não confiar em um contador enviado pelo cliente.
- Indicadores declaram denominador, período, atribuições consideradas, alunos inativos, filtros por turma e tratamento de transferências/matrículas históricas.
- Coletar o mínimo necessário para apoiar aprendizagem; nunca presumir que velocidade ou número bruto de falhas mede domínio pedagógico.

## Segurança, isolamento e privacidade infantil

Antes de lançar contas escolares:

1. Aplicar isolamento por tenant no backend, APIs, consultas, relatórios e operações de suporte; filtro visual não é autorização.
2. Permissões granulares por papel/escola/turma, com vínculo obrigatório para acesso de instrutor aos alunos.
3. Autenticação, recuperação e desativação apropriadas à faixa etária e à política institucional.
4. Minimização de dados, pseudônimos/identificadores institucionais quando viáveis, sem coleta desnecessária.
5. Definir base legal, avisos, responsabilidades da escola, autorizações/consentimentos aplicáveis, retenção, eliminação, exportação e resposta a incidentes antes do lançamento.
6. Auditoria de acesso administrativo/suporte, mudanças de papel, publicação, atribuição e exportação.
7. Rate limiting, validação de servidor, proteção de sessões, backup/recuperação, ambientes separados e controle operacional.
8. Regras de múltiplos vínculos, transferências e preservação de histórico sem exposição indevida.
9. Proibir dados de alunos em logs públicos, arquivos do Pages, exemplos JSON, URLs compartilhadas e telemetria de terceiros.
10. Descoberta com escolas/instrutores para onboarding, experiência, suporte, operação e governança antes de escolher tecnologia.

## Sequenciamento candidato, sem compromisso de entrega

- **V2.0-A:** backend/identidade, autenticação/autorização, isolamento, escolas/usuários/papéis e auditoria.
- **V2.0-B:** turmas, instrutores, matrículas e catálogo versionado de níveis.
- **V2.0-C:** atribuição de missões, execução autenticada e tentativas/progresso persistidos com segurança.
- **V2.0-D:** painéis por turma/escola, indicadores pedagógicos, filtros e exportações controladas.

V1.0 deve primeiro consolidar pedagogia/UX/acessibilidade local com crianças e responsáveis. V0.9 entrega autoria portátil para esse processo; não simula uma plataforma institucional pronta.
