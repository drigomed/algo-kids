// Somente representação: regras e interpretação permanecem fora do DOM.
export const labels = {move:'Avançar', turnLeft:'Virar à esquerda', turnRight:'Virar à direita'};
const icons = {move:'↑', turnLeft:'↶', turnRight:'↷'};
export const escapeHtml = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'}[c]));
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const prefix = (path, full) => full && path.every((part, i) => full[i] === part) && full.length >= path.length;
export const encodePath = path => path.join('.');
export const decodePath = path => path ? path.split('.').map(part => ['then','else'].includes(part) ? part : Number(part)) : [];
export function renderProgram(program, mission, execution, target, disabled, basePath = []) {
  return program.map((node, index) => {
    const path = [...basePath, index], key = encodePath(path), active = same(path, execution.activePath);
    const controls = `<div class="row-controls"><button data-edit="up" data-path="${key}" aria-label="Mover bloco ${index + 1} para cima" ${disabled || index === 0 ? 'disabled' : ''}>↑</button><button data-edit="down" data-path="${key}" aria-label="Mover bloco ${index + 1} para baixo" ${disabled || index === program.length - 1 ? 'disabled' : ''}>↓</button><button data-edit="remove" data-path="${key}" aria-label="Remover bloco ${index + 1}" ${disabled ? 'disabled' : ''}>×</button></div>`;
    if (node.type !== 'if') return `<li class="command ${node.type} ${active ? 'active' : ''}" ${active ? 'aria-current="step"' : ''}><span class="command-number">${index + 1}</span><b>${icons[node.type]}</b><span>${labels[node.type]}</span>${controls}</li>`;
    const within = prefix(path, execution.activePath), condition = node.condition;
    const chosen = active && same(execution.decision?.path, path) ? execution.decision.branch : within ? execution.activePath[path.length] : null;
    const numericVariables = Object.keys(mission.initialVariables ?? {}).filter(name => typeof mission.initialVariables[name] === 'number');
    numericVariables.push('collectedCount');
    const variableLabel = name => name === 'collectedCount' ? 'Objetos coletados' : mission.presentation?.variables?.[name] ?? name;
    const fields = condition.type === 'stateAtLeast' ? `<div class="threshold-fields"><label>Contador<select data-field="variable" data-path="${key}" ${disabled ? 'disabled' : ''}>${numericVariables.map(name => `<option value="${escapeHtml(name)}" ${name === condition.variable ? 'selected' : ''}>${escapeHtml(variableLabel(name))}</option>`).join('')}</select></label><label>Pelo menos<input type="number" inputmode="numeric" min="0" max="99" step="1" value="${condition.value}" data-field="threshold" data-path="${key}" ${disabled ? 'disabled' : ''}></label></div>` : '';
    const branches = ['then','else'].map(branch => {
      const branchPath = [...path, branch], selected = same(target, branchPath);
      return `<section class="branch ${branch} ${chosen === branch ? 'executing-branch' : ''} ${selected ? 'insertion-branch' : ''}"><div class="branch-heading"><strong>${branch === 'then' ? 'ENTÃO' : 'SENÃO'}</strong><button data-target="${encodePath(branchPath)}" ${disabled ? 'disabled' : ''} aria-pressed="${selected}">${selected ? '✓ Adicionando aqui' : '+ Adicionar aqui'}</button></div><ol class="branch-list">${node[branch].length ? renderProgram(node[branch], mission, execution, target, disabled, branchPath) : '<li class="branch-empty">Este ramo ainda não tem comandos.</li>'}</ol></section>`;
    }).join('');
    return `<li class="condition-block ${within ? 'active-block' : ''} ${active ? 'active' : ''}" ${active ? 'aria-current="step"' : ''}><div class="condition-heading"><strong>SE</strong><span>Bloco ${index + 1}</span>${controls}</div><label class="condition-choice">Pergunta<select data-field="condition" data-path="${key}" ${disabled ? 'disabled' : ''}><option value="pathClear" ${condition.type === 'pathClear' ? 'selected' : ''}>Caminho à frente livre</option><option value="stateAtLeast" ${condition.type === 'stateAtLeast' ? 'selected' : ''}>Contador atingiu uma quantidade</option></select></label>${fields}${branches}</li>`;
  }).join('');
}
export function renderBoard(mission, state) {
  return Array.from({length: mission.grid.width * mission.grid.height}, (_, i) => {
    const row = Math.floor(i / mission.grid.width), col = i % mission.grid.width;
    const robot = state.row === row && state.col === col, goal = mission.goal.row === row && mission.goal.col === col;
    const rock = mission.grid.obstacles.some(o => o.row === row && o.col === col);
    const entities = (mission.entities ?? []).filter(e => e.row === row && e.col === col && !(e.collectible && state.collectedIds.includes(e.id)));
    const objects = entities.map(e => {
      const visual = mission.presentation?.entities?.[e.id] ?? {};
      const effects = e.onEnter.filter(a => a.type === 'increment').map(a => `${mission.presentation?.variables?.[a.variable] ?? a.variable}: +${a.amount}`).join(', ');
      return `<span class="entity" title="${escapeHtml(visual.label ?? mission.presentation?.entityLabel ?? 'Objeto')}: ${escapeHtml(effects)}">${escapeHtml(visual.glyph ?? mission.presentation?.entityGlyph ?? '●')}<small>${e.onEnter.some(a => a.type === 'increment' && a.amount !== 1) ? escapeHtml(e.onEnter.filter(a => a.type === 'increment').map(a => `+${a.amount}`).join(' ')) : ''}</small></span>`;
    }).join('');
    return `<div class="cell ${(row + col) % 2 ? 'alternate' : ''} ${goal ? 'goal' : ''}">${goal ? '<span class="star">★</span>' : ''}${rock ? '<span class="rock">◆</span>' : ''}${objects}${robot ? `<div class="robot" style="--angle:${{N:0,L:90,S:180,O:270}[state.direction]}deg"><span class="robot-arrow">▲</span><span class="robot-head"><i></i><i></i></span><span class="robot-body"></span></div>` : ''}</div>`;
  }).join('');
}
