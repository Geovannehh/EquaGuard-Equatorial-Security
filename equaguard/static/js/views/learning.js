import {
    state,
    ui
} from '../core.js';
import {
    heading,
    lessonCard
} from './components.js';

export function learning() {
    let lessons = state.lessons.filter(l => ui.filter === 'done' ? state.progress.lessons.includes(l
        .id) : ui.filter === 'todo' ? !state.progress.lessons.includes(l.id) : true);
    return heading('Aprender é sua primeira defesa',
            'EquaLearn · Lições curtas para decisões mais seguras na rotina',
            '<span class="chip cyan">3–4 min por lição</span>') +
        `<div class="toolbar" aria-label="Filtrar lições">${[['all','Todas as lições'],['todo','Para aprender'],['done','Concluídas']].map(([k,l])=>`<button class="filter ${ui.filter===k?'active':''}" aria-pressed="${ui.filter===k}" data-action="filter" data-id="${k}">${l}</button>`).join('')}</div>
<div class="cards">${lessons.length?lessons.map(lessonCard).join(''):'<div class="empty">Nenhuma lição nesta categoria. Escolha outro filtro ou comece uma nova lição.</div>'}</div>`;
}
