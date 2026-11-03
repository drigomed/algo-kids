// Auditoria determinística do catálogo vigente; não altera documentos históricos.
import {writeFileSync,readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
import {missions,missionVariants} from '../src/missions.js';
import {simulate,validateMission} from '../src/engine.js';
import {linearPrograms} from './curriculum-probes.js';
const legacy=JSON.parse(readFileSync(new URL('../tests/fixtures/v093-catalog.json',import.meta.url)));
const rows=[],changes=[];
for(const m of missions){
 validateMission(m);const old=legacy.find(s=>s.id===m.id);
 changes.push(`| ${m.id} · ${m.title} | ${Object.keys(m).filter(k=>JSON.stringify(m[k])!==JSON.stringify(old[k])).join(', ')||'Nenhum'} |`);
 for(const s of missionVariants(m)){
  const states=simulate(s,m.solution),end=states.at(-1);assert.equal(end.status,'won',`${m.id}/${s.variantId}`);
  rows.push(`| ${m.id} · ${s.variantId} | (${s.start.row},${s.start.col}) → (${s.goal.row},${s.goal.col}) | ${end.status} / ${end.instructionPointer} | ${end.energyInitial===undefined?'—':`${end.energyInitial} / ${end.energySpent} / ${end.energyRemaining}`} | ${s.interactionPolicy??'Sem interação explícita'} |`);
 }
}
assert.equal(missions.length,32);assert.equal(rows.length,68);assert(!missions.some(m=>m.id===28));
const destination=missions.find(m=>m.id===23),fixed=linearPrograms(destination.solution);assert(fixed.length>=3);assert(fixed.every(p=>missionVariants(destination).some(s=>simulate(s,p).at(-1).status!=='won')));
writeFileSync('docs/V094-MISSION-AUDIT.md',`# Auditoria curricular V0.9.4\n\nGerada por \`node scripts/audit-v094.mjs\`. Base V093: 9dc4a76, catálogo histórico congelado. **32 missões / 68 cenários, todas referências aprovadas.** Coordenadas 0-based, solução base única por missão. Energia: inicial / gasta / restante; custo não é otimizado.\n\nA 28 foi removida; demais IDs preservados. Os ${fixed.length} candidatos fixos derivados dos ramos da referência 23 falham em pelo menos uma variante; a AST ESCOLHA vence A/B/C/X. É contraprova dessas rotas, não busca exaustiva de todos programas.\n\n## Cenários atuais\n\n| Missão / variante | Início → meta | Resultado / instruções | Energia | Política |\n|---|---|---|---|---|\n${rows.join('\n')}\n\n## Diferenças de campos em relação à V093\n\nA tabela inclui normalização declarativa de variantes e apresentação. Não implica novos mecanismos no motor. 13 muda CSS compartilhado; 32 só explicita a política here.\n\n| Missão | Campos diferentes |\n|---|---|\n${changes.join('\n')}\n\n## Revisões e limites\n\n05 remove dois comandos pendentes da referência. 08 custa 7 de 9; 16 custa 3/5 de 6, com curvas gratuitas explícitas. 17 tem vermelho aberto e azul dependente de pacote no mesmo mapa; coletar sempre continua alternativa válida. 19 exige autorização inicial falsa tanto para entrega quanto para encerrar. Na 23, as estações são três pontos visíveis e as metas variam A/B/T/T; não há controle sobre o robô inicial. 27 materializa estado por variante antes de reordenar. 30/31/33 entram no ponto de retirada e na lixeira, com barreira depois da pilha; 33 mantém gasto 18/30.\n\nContratos antigos são testados com dados históricos identificados. Os positivos de todos os cenários atuais também percorrem JSON, incremental, sessões e Studio em tests/v094.test.js; os negativos verificam comandos extras, autorização, posição, rotas fixas e guardas. Não se afirma unicidade de soluções nem necessidade estrita de todas as decisões pedagógicas.\n`);
console.log(`${missions.length} missões / ${rows.length} cenários / ${fixed.length} rotas fixas 23 rejeitadas`);
