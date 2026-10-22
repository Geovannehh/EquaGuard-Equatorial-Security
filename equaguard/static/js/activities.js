import {
    $,
    esc,
    state,
    ui,
    api,
    toast,
    chatHistory
} from './core.js';
import {
    chatMessages
} from './views/assistant.js';
import {
    refresh,
    navigate
} from './navigation.js';

export function openActivity(type, html) {
    $('#activity-type').textContent = type;
    $('#activity-content').innerHTML = html;
    if (!$('#activity-dialog').open) $('#activity-dialog').showModal();
    $('#activity-dialog').scrollTop = 0;
}
export function choiceFields(choices, name = 'choice') {
    return `<div class="choices">${choices.map((c,i)=>`<label class="choice">
<input type="radio" name="${name}" value="${i}" required>
<span>${esc(c)}</span>
</label>`).join('')}</div>`;
}
export function lesson(id) {
    const l = state.lessons.find(l => l.id === id);
    if (!l) return;
    ui.activity = {
        kind: 'lesson',
        id
    };
    openActivity('EQUALEARN · ' + l.minutes + ' MIN · +50 XP', `<h2 id="activity-title">${esc(l.title)}</h2>
<div class="lesson-body">${l.body.map(p=>`<p>${esc(p)}</p>`).join('')}</div>
<form id="activity-form">
<p class="question">${esc(l.question)}</p>${choiceFields(l.choices)}<button class="button primary wide" type="submit">Verificar minha resposta →</button>
<p class="error" role="alert">
</p>
</form>`);
}
export function scenario(id) {
    const s = state.scenarios.find(s => s.id === id);
    if (!s) return;
    if (s.advanced && !state.progress.lessons.includes('senhas')) return lesson('senhas');
    ui.activity = {
        kind: 'scenario',
        id,
        stage: 'first'
    };
    openActivity('EQUASIM · DECISÃO 1 DE 2', `<h2 id="activity-title">${esc(s.title)}</h2>
<span class="chip cyan">${esc(s.label)} · Cenário fictício</span>
<div class="mail-preview">
<div class="mail-header">De: ${esc(s.sender)}</div>
<div class="mail-body">
<h3>${esc(s.subject)}</h3>
<p>${esc(s.message)}</p>${s.fake_link?`<span class="fake-link">${esc(s.fake_link)}</span>`:''}</div>
</div>
<p class="simulation-note">Exercício fictício: nenhum link será aberto e nenhum dado será solicitado.</p>
<form id="activity-form">
<p class="question">Qual seria sua decisão?</p>${choiceFields(s.choices)}<button class="button primary wide" type="submit">Confirmar minha decisão →</button>
<p class="error" role="alert">
</p>
</form>`);
}
export function assessment(phase) {
    const p = state.progress;
    if (phase === 'pre' && p.pre !== null) {
        navigate('conquistas');
        return;
    }
    if (phase === 'post' && (p.pre === null || !p.lessons.length)) {
        toast('Conclua o diagnóstico e pelo menos uma lição antes de reavaliar.');
        return;
    }
    ui.activity = {
        kind: 'assessment',
        phase
    };
    openActivity(phase === 'pre' ? 'DIAGNÓSTICO · SEU PONTO DE PARTIDA' :
        'REAVALIAÇÃO · SUA EVOLUÇÃO', `<h2 id="activity-title">${phase==='pre'?'Como você decide hoje?':'O que mudou nas suas decisões?'}</h2>
<p>Três situações rápidas. Suas respostas orientam os próximos passos.</p>
<form id="activity-form">${state.diagnostics[phase].map((q,i)=>`<div class="assessment-block">
<fieldset>
<legend>${i+1}. ${esc(q.question)}</legend>${choiceFields(q.choices,'q'+i)}</fieldset>
</div>`).join('')}<button class="button primary wide lower-section" type="submit">Concluir avaliação →</button>
<p class="error" role="alert">
</p>
</form>`);
}
export function nextStep() {
    const step = ui.activity.next;
    ui.activity.stage = 'followup';
    openActivity('EQUASIM · DECISÃO 2 DE 2', `<h2 id="activity-title">A história continua…</h2>
<p class="notice">Sua escolha anterior levou a esta situação.</p>
<form id="activity-form">
<p class="question">${esc(step.question)}</p>${choiceFields(step.choices)}<button class="button primary wide" type="submit">Confirmar próximo passo →</button>
<p class="error" role="alert">
</p>
</form>`);
}
export async function submitActivity(form) {
    if (ui.busy) return;
    ui.busy = true;
    const submit = $('button[type=submit]', form);
    submit.disabled = true;
    const current = {
        ...ui.activity
    };
    try {
        const data = new FormData(form);
        let result;
        if (current.kind === 'assessment') result = await api('assessment', {
            phase: current.phase,
            answers: [0, 1, 2].map(i => Number(data.get('q' + i)))
        });
        else result = await api(current.kind, {
            id: current.id,
            choice: Number(data.get('choice')),
            stage: current.stage
        });
        await refresh();
        ui.activity = {
            ...current,
            next: result.next_step
        };
        const good = current.kind === 'assessment' ? true : result.correct;
        const rec = state.progress.recommendations[0];
        let actions = '';
        if (current.kind === 'scenario' && result.next_step) actions =
            `<button class="button primary" data-action="next">${current.stage==='first'?'Continuar a história':'Tentar esta decisão novamente'} →</button>`;
        else if (current.kind === 'lesson' && !result.correct) actions =
            `<button class="button primary" data-action="lesson" data-id="${current.id}">Revisar e tentar novamente →</button>`;
        else actions =
            `<button class="button primary" data-action="close">Continuar minha jornada →</button>`;
        if (rec) actions +=
            `<button class="button ghost" data-action="recommendation" data-id="${rec.lesson}">Abrir lição recomendada</button>`;
        openActivity('FEEDBACK · APRENDER COM CADA ESCOLHA',
            `<h2 id="activity-title">${current.kind==='assessment'?'Seu ponto de evolução está registrado.':good?'Uma escolha que protege.':'Vamos transformar essa decisão em aprendizado.'}</h2>
<div class="feedback ${good?'correct':''}">
<h3>${current.kind==='assessment'?result.score+' de 3 respostas seguras':good?'Boa decisão!':'Há uma alternativa mais segura'}</h3>
<p>${esc(result.feedback)}</p>
<span class="xp">${result.xp?'+'+result.xp+' XP conquistados':good?'Conhecimento reforçado · sem XP duplicado':'Continue praticando. Você pode tentar novamente.'}</span>
</div>${result.results?result.results.map(r=>`<div class="review-answer">
<strong>${r.correct?'✓':'↻'} ${esc(r.question)}</strong>
<br>Decisão segura: ${esc(r.explanation)}</div>`).join(''):''}${rec?`<p class="fineprint">GuardIA recomenda: ${esc(rec.title)} — ${esc(rec.reason)}</p>`:''}<div class="actions lower-section">${actions}</div>`
        );
    } catch (e) {
        const error = $('.error', form);
        if (error) error.textContent = e.message;
        else toast(e.message);
        submit.disabled = false;
    } finally {
        ui.busy = false;
    }
}
export function scrollChat() {
    const el = $('#messages');
    if (el) el.scrollTop = el.scrollHeight;
}
export async function ask(question) {
    if (ui.busy) return;
    ui.busy = true;
    chatHistory.push({
        user: question
    });
    if ($('#messages')) {
        $('#messages').innerHTML = chatMessages();
        scrollChat();
    }
    const button = $('#chat-form button');
    if (button) button.disabled = true;
    try {
        const result = await api('guardia', {
            question
        });
        chatHistory.push(result);
    } catch (e) {
        chatHistory.push({
            answer: e.message + ' Você pode enviar a pergunta novamente.'
        });
    } finally {
        ui.busy = false;
        if ($('#messages')) {
            $('#messages').innerHTML = chatMessages();
            scrollChat();
        }
        if (button) button.disabled = false;
    }
}
