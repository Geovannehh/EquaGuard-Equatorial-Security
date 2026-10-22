import {
    esc,
    state,
    ui,
    api
} from '../core.js';
import {
    icon
} from '../icons.js';
import {
    heading,
    pct
} from './components.js';

export async function insights(id) {
    if (state.role !== 'manager') return heading('Aprendizagem vista em conjunto',
        'EquaInsights · Indicadores agregados para orientar ações educativas') + `<div class="empty">${icon('chart')}<h2>Experimente a visão de gestão</h2>
<p>O modo colaborador mostra seu próprio progresso.<br>Selecione “Gestão” no acesso demonstrativo para explorar os indicadores agregados.</p>
<button class="button primary" data-action="profile">Trocar perfil de demonstração</button>
</div>`;
    const a = await api('analytics');
    if (id !== ui.renderId) return null;
    const val = n => n === null ? '—' : `${n}%`;
    return heading('Uma cultura de segurança se constrói juntos',
            'EquaInsights · Dados agregados de aprendizagem neste ambiente local',
            '<span class="chip amber">Somente demonstração</span>') +
        `<div class="notice">
<strong>Dados de uso dos perfis fictícios deste MVP:</strong> Estes indicadores não representam resultados da Equatorial. Sem ranking individual ou avaliação punitiva.</div>
<div class="stat-grid">
<article class="stat">
<span class="stat-label">Perfis que entraram no demo</span>
<strong>${a.users}</strong>
<small>Perfis criados neste banco</small>
</article>
<article class="stat">
<span class="stat-label">Conclusão das lições</span>
<strong>${a.completion}%</strong>
<small>${a.completed_lessons} de ${a.users*5} conclusões possíveis</small>
</article>
<article class="stat">
<span class="stat-label">Acertos nas simulações</span>
<strong>${val(a.recognition)}</strong>
<small>${a.attempts} decisões registradas</small>
</article>
<article class="stat">
<span class="stat-label">Evolução pré → pós</span>
<strong>${a.evolution===null?'—':`${a.evolution>0?'+':''}${a.evolution}`} <small>${a.evolution===null?'':'p.p.'}</small>
</strong>
<small>${a.paired_users} perfis com ambas as avaliações</small>
</article>
</div>
<div class="dashboard-grid">
<section class="bars">
<div class="section-title">
<h2>Aprendizagem por competência</h2>
</div>${a.competence.length?a.competence.map(c=>`<div class="bar-row">
<div>
<span>${esc(state.lessons.find(l=>l.id===c.topic)?.topic||c.topic)}</span>
<strong>${pct(c.correct,c.attempts)}%</strong>
</div>
<div class="track" role="meter" aria-label="Acertos em ${esc(c.topic)}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${pct(c.correct,c.attempts)}">
<span style="width:${pct(c.correct,c.attempts)}%">
</span>
</div>
<small>${c.correct} respostas seguras em ${c.attempts} tentativas</small>
</div>`).join(''):'<p class="empty">Ainda não há respostas. Complete uma atividade para gerar indicadores.</p>'}</section>
<section class="bars">
<h2>Da percepção à ação</h2>
<div class="stat">
<span class="stat-label">Reporte correto de phishing</span>
<strong>${val(a.report_rate)}</strong>
<small>${a.report_attempts} primeiras decisões no cenário de e-mail</small>
</div>
<div class="stat lower-section">
<span class="stat-label">Recomendações abertas</span>
<strong>${a.recommendations.used} <small>/ ${a.recommendations.offered}</small>
</strong>
<small>Pares únicos de perfil e lição recomendada</small>
</div>
</section>
</div>
<p class="methodology">Metodologia: acertos incluem todas as tentativas, inclusive revisões; conclusão conta lições únicas por perfil; evolução compara o primeiro diagnóstico com a última reavaliação de cada perfil. “—” indica ausência de dados. A gestão vê agregados, sem lista nominal.</p>`;
}
