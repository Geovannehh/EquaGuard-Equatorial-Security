import {
    esc,
    state
} from '../core.js';
import {
    icon
} from '../icons.js';
import {
    heading,
    progressStats
} from './components.js';

export function achievements() {
    const p = state.progress,
        delta = p.post !== null && p.pre !== null ? Math.round((p.post - p.pre) / 3 * 100) : null;
    return heading('Cada passo deixa uma conquista',
        'Seu progresso pertence à sua jornada de aprendizagem') + progressStats() + `<div class="notice">
<strong>Antes e depois:</strong> diagnóstico ${p.pre===null?'não realizado':p.pre+'/3'} · reavaliação ${p.post===null?'não realizada':p.post+'/3'}${delta!==null?` · Variação de ${delta>0?'+':''}${delta} pontos percentuais`:''}. <button class="text-link" data-action="assessment" data-id="${p.pre===null?'pre':'post'}">${p.pre===null?'Fazer diagnóstico':'Fazer reavaliação'} →</button>
</div>
<div class="badge-grid">${p.badges.map(b=>`<article class="badge-card ${b.earned?'earned':''}">
<div class="medal">${icon(b.earned?'award':'lock')}</div>
<h3>${b.name}</h3>
<p>${b.description}</p>
<span class="chip ${b.earned?'green':''}">${b.earned?'Conquista desbloqueada':'Em construção'}</span>
</article>`).join('')}</div>
<section class="lower-section">
<div class="section-title">
<h2>Suas últimas decisões</h2>
<span class="chip">${p.attempt_count} respostas registradas</span>
</div>
<div class="timeline">${p.attempts.length?p.attempts.map(a=>`<div class="history-row">
<div>${esc(state.lessons.find(l=>l.id===a.topic)?.topic || a.topic)}<small>${({pre:'Diagnóstico',post:'Reavaliação',lesson:'Lição',scenario:'Simulação'})[a.kind]} · ${esc(a.created_at)} UTC</small>
</div>
<span class="chip ${a.correct?'green':'amber'}">${a.correct?'Decisão segura':'Oportunidade de aprender'}</span>
</div>`).join(''):'<p class="empty">Sua primeira atividade vai aparecer aqui.</p>'}</div>
<p class="methodology">Os pontos são concedidos uma única vez por objetivo. Repetir atividades ajuda a aprender, sem acumular XP duplicado.</p>
</section>`;
}
