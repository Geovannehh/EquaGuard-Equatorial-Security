import {
    esc,
    state
} from '../core.js';
import {
    icon
} from '../icons.js';

export function heading(title, subtitle, chip = '') {
    return `<div class="page-heading">
<div>
<h1>${title}</h1>
<p>${subtitle}</p>
</div>${chip}</div>`;
}
export const pct = (a, b) => b ? Math.round(a / b * 100) : 0;

export function progressStats() {
    const p = state.progress,
        next = p.next_level;
    return `<div class="stat-grid">
<article class="stat">${icon('bolt')}<span class="stat-label">Sua energia de proteção</span>
<strong>${p.xp} <small>XP</small>
</strong>
<small>${next ? `${next-p.xp} XP para o próximo nível` : 'Nível máximo conquistado'}</small>
<div class="track">
<span style="width:${next?pct(p.xp-p.level_start,next-p.level_start):100}%">
</span>
</div>
</article>
<article class="stat">${icon('shield')}<span class="stat-label">Nível ${p.level}</span>
<strong>${esc(p.level_name)}</strong>
<small>Cada boa decisão conta</small>
</article>
<article class="stat">${icon('book')}<span class="stat-label">Lições concluídas</span>
<strong>${p.lessons.length} <small>/ ${state.lessons.length}</small>
</strong>
<small>${p.estimated_minutes} min de conteúdo estimado</small>
</article>
<article class="stat">${icon('award')}<span class="stat-label">Conquistas desbloqueadas</span>
<strong>${p.badges.filter(b=>b.earned).length} <small>/ ${p.badges.length}</small>
</strong>
<small>Aprendizado que ganha forma</small>
</article>
</div>`;
}

export function lessonCard(l) {
    const done = state.progress.lessons.includes(l.id);
    return `<article class="content-card">
<div class="card-top">
<span class="card-icon">${icon(l.icon)}</span>
<span class="chip ${done?'green':''}">${done?'✓ Concluída':'+50 XP'}</span>
</div>
<p class="eyebrow">${esc(l.topic)}</p>
<h3>${esc(l.title)}</h3>
<p>${esc(l.description)}</p>
<div class="card-meta">${l.minutes} min de leitura estimada · Lição + desafio</div>
<button class="button ${done?'ghost':'primary'}" data-action="lesson" data-id="${l.id}">${done?'Revisar conteúdo':'Começar lição'} <span>→</span>
</button>
</article>`;
}

export function scenarioCard(s) {
    const done = state.progress.scenarios.includes(s.id),
        locked = s.advanced && !state.progress.lessons.includes('senhas');
    return `<article class="content-card">
<div class="card-top">
<span class="card-icon">${icon(s.icon)}</span>
<span class="chip ${done?'green':locked?'amber':''}">${done?'✓ Praticado':locked?'Bloqueado':'Até 120 XP'}</span>
</div>
<p class="eyebrow">${esc(s.label)}</p>
<h3>${esc(s.title)}</h3>
<p>${esc(s.description)}</p>
<div class="card-meta">${s.minutes} min · 2 decisões · Feedback imediato</div>
<button class="button ${locked?'ghost':'primary'}" data-action="${locked?'lesson':'scenario'}" data-id="${locked?'senhas':s.id}">${locked?'Estudar senhas para liberar':done?'Praticar novamente':'Entrar na simulação'} <span>→</span>
</button>
</article>`;
}
