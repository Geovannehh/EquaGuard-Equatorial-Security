import {
    $,
    esc,
    state,
    api,
    toast,
    view
} from './core.js';
import {
    icon
} from './icons.js';
import {
    heading
} from './views/components.js';
import {
    refresh,
    renderPage
} from './navigation.js';

let run = null,
    timer = null,
    synchronizer = null,
    baseline = 0,
    observed = 0,
    pending = false,
    briefing = false,
    syncing = false,
    lastExpiryCheck = 0;
const roomNames = ['Comunicação', 'Acessos', 'Dispositivo', 'Dados de clientes',
    'Infraestrutura'
];
const roomIcons = ['mail', 'key', 'device', 'shield', 'bolt'];
const clockText = seconds =>
    `${String(Math.floor(seconds/60)).padStart(2,'0')}:${String(seconds%60).padStart(2,'0')}`;
const mask = () => `<svg class="hacker-mask" viewBox="0 0 160 170" aria-hidden="true">
<path d="M80 8C43 9 20 45 14 103l22 14 10-39 12-17h44l13 17 9 39 22-14C140 45 117 9 80 8Z" fill="#1b2d44" stroke="#213750" stroke-width="2"/>
<path d="M41 70h78l-6 47-33 34-33-34Z" fill="#101c2b" stroke="#3a5878" stroke-width="2"/>
<path d="m51 83 21 9m16 0 21-9" stroke="#fa9478" stroke-width="6"/>
<path d="m66 123 14-5 14 5M80 96l-4 13h8" stroke="#a9b8c9" stroke-width="3" fill="none"/>
<path d="M30 151 9 165m121-14 21 14" stroke="#f5c242" stroke-width="2"/>
</svg>`;
const city = () => `<div class="escape-city" aria-hidden="true">
<svg viewBox="0 0 500 230">
<defs>
<linearGradient id="cityGlow" x2="0" y2="1">
<stop stop-color="#f5c242" stop-opacity=".28"/>
<stop offset="1" stop-color="#f5c242" stop-opacity="0"/>
</linearGradient>
</defs>
<path d="M0 196H38v-51h38v51h25V95h58v101h18V60h48v136h24v-81h45v81h24V78h55v118h25v-54h42v54h60v34H0Z" fill="url(#cityGlow)" stroke="#213750"/>
<path d="M38 159h37M112 110h34m-34 16h34m-34 16h34m-34 16h34m45-83h20m-20 18h20m-20 18h20m51 17h20m-20 18h20m54-52h28m-28 17h28m-28 17h28m50 29h16" stroke="#f5c242" stroke-width="3"/>
<path d="M19 212h460M85 201v20m153-20v20m153-20v20" stroke="#213750"/>
<path d="m258 10-34 42h27l-5 29 39-48h-29Z" fill="#f5c242"/>
</svg>
<span>REDE DEMONSTRATIVA · 5 BARREIRAS</span>
</div>`;

function intro() {
    return `<div class="escape-page">${heading('Uma missão pela energia protegida', 'Escape Room · Guardiões da Energia Digital', '<span class="chip cyan">Solo ou em equipe</span>')}<section class="escape-cover">
<div class="escape-cover-copy">
<p class="eyebrow">OPERAÇÃO GUARDIÃO / ARQUIVO 237</p>
<h2>O tempo está correndo<br>A próxima defesa<br>
<em>é você</em>
</h2>
<p>O Hacker Apagão iniciou um ataque fictício à rede digital. Cinco barreiras estão vulneráveis. Analisem as pistas, fechem cada brecha e recuperem o código para impedir o ataque.</p>
<div class="escape-specs">
<span>${icon('user')} 1–6 participantes</span>
<span>${icon('clock')} 20 ou 30 minutos</span>
<span>${icon('lock')} 5 salas + final</span>
</div>
</div>
<div class="escape-cover-art">
<div class="escape-threat">
<span class="threat-indicator">
</span>TRANSMISSÃO INTERCEPTADA</div>${mask()}<blockquote>“A distração de vocês<br>é a minha melhor entrada.”<cite>HACKER APAGÃO</cite>
</blockquote>${city()}</div>
</section>
<div class="escape-brief-grid">
<section class="escape-setup">
<p class="eyebrow">01 / PREPARE SUA MISSÃO</p>
<h2>Preparar a missão</h2>
<p>Jogue sozinho ou reúna de 2 a 6 pessoas na mesma tela. Analise as pistas e escolha uma resposta segura para avançar.</p>
<form id="escape-start-form">
<label for="escape-team">Nome do jogador ou da equipe <small>Use um nome fictício</small>
</label>
<input id="escape-team" name="team" type="text" value="Guardiões da Luz" minlength="2" maxlength="32" required autocomplete="off">
<div class="escape-form-grid">
<div>
<label for="escape-members">Participantes</label>
<select id="escape-members" name="members">${[1,2,3,4,5,6].map(n=>`<option value="${n}" ${n===3?'selected':''}>${n===1?'1 jogador — Solo':n+' jogadores — Equipe'}</option>`).join('')}</select>
</div>
<div>
<label for="escape-minutes">Tempo da missão</label>
<select id="escape-minutes" name="minutes">
<option value="20">20 min · Desafio</option>
<option value="30">30 min · Mais tempo</option>
</select>
</div>
</div>
<label class="escape-ready">
<input type="checkbox" name="ready" required>
<span>Tudo pronto. O cronômetro começa ao iniciar e continua ao sair ou atualizar a página.</span>
</label>
<button class="button primary wide" type="submit">${icon('bolt')} Iniciar operação Guardião →</button>
<p class="error" role="alert">
</p>
</form>${run&&run.status!=='active'?'<button class="text-link" data-escape="result">Voltar ao resultado anterior</button>':''}</section>
<section class="escape-brief">
<p class="eyebrow">02 / ENTENDAM O PLANO</p>
<h2>Cinco barreiras, um código</h2>
<ol class="escape-objectives">${roomNames.map((name,i)=>`<li>
<span>${String(i+1).padStart(2,'0')}</span>
<div>
<strong>${name}</strong>
<small>${['Identifiquem a mensagem fraudulenta','Combinem as duas chaves de proteção','Respondam à perda de um equipamento','Contenham um compartilhamento indevido','Validem o acesso à operação'][i]}</small>
</div>${icon(roomIcons[i])}</li>`).join('')}</ol>
<div class="escape-rules">
<p>
<strong>Decisão incorreta:</strong> −30 segundos. Vocês podem tentar novamente.</p>
<p>
<strong>Dica opcional:</strong> −1 minuto, uma cobrança por sala.</p>
<p>
<strong>Vitória:</strong> até 250 XP e a conquista Guardiões da Energia no perfil que iniciou a partida. Repetições não duplicam XP.</p>
</div>
</section>
</div>
<p class="fineprint">Todos os contatos, equipamentos e ataques são fictícios. Não há ligação com sistemas operacionais reais. O jogo permite uma pessoa ou uma equipe na mesma tela, sem sincronização entre dispositivos.</p>
</div>`;
}

function routeMap() {
    return `<ol class="escape-map" aria-label="Progresso da operação">${run.rooms.map((r,i)=>`<li class="${i<run.stage?'complete':i===run.stage?'current':'locked'}">
<span>${i<run.stage?icon('check'):i===run.stage?icon(r.icon):icon('lock')}</span>
<div>
<small>SALA ${String(i+1).padStart(2,'0')}</small>
<strong>${esc(roomNames[i])}</strong>
<em>${i<run.stage?'Protegida':i===run.stage?'Em análise':'Bloqueada'}</em>
</div>
</li>`).join('')}<li class="${run.stage===5?'current':'locked'}">
<span>${icon(run.stage===5?'bolt':'lock')}</span>
<div>
<small>ETAPA FINAL</small>
<strong>Protocolo</strong>
<em>${run.stage===5?'Liberado':'Bloqueado'}</em>
</div>
</li>
</ol>`;
}

function inventory() {
    return `<section class="escape-inventory">
<p class="eyebrow">INVENTÁRIO DA EQUIPE</p>
<h3>Fragmentos de proteção</h3>
<p>Cada sala resolvida revela um dígito. Guardem a ordem para o protocolo final.</p>
<div class="escape-fragments">${roomNames.map((n,i)=>{const f=run.fragments[i];return `<div class="${f?'collected':''}">
<small>${String(i+1).padStart(2,'0')}</small>
<strong>${f?f.code:icon('lock')}</strong>
<span>${f?f.seal:'FECHADO'}</span>
</div>`;}).join('')}</div>
</section>`;
}

function team() {
    if (run.members === 1) {
        return `<section class="escape-team"><p class="eyebrow">MISSÃO SOLO</p>
<h3>${esc(run.team)}</h3><p>Você conduz esta missão</p>
<ol><li>Leia as pistas</li><li>Compare as evidências</li><li>Escolha a decisão mais segura</li></ol>
<small>Seu progresso é salvo neste perfil</small></section>`;
    }
    const driver = run.stage % run.members;
    const roster = Array.from({
        length: run.members
    }, (_, index) => {
        const isDriver = index === driver;
        const label =
            `Guardião ${index + 1}${isDriver ? ' conduz esta sala' : ''}`;
        return `<span class="${isDriver ? 'driver' : ''}" title="${label}">G${index + 1}</span>`;
    }).join('');
    const role = run.room?.role.toLowerCase() || 'coordenador da resposta final';
    return `<section class="escape-team">
            <p class="eyebrow">EQUIPE EM AÇÃO</p>
            <h3>${esc(run.team)}</h3>
            <div class="escape-roster">${roster}</div>
            <p><strong>Guardião ${driver + 1}</strong>, conduza esta etapa como ${esc(role)}.</p>
            <ol>
                <li>Uma pessoa lê as pistas.</li>
                <li>Outra questiona as hipóteses.</li>
                <li>A equipe decide antes de confirmar.</li>
            </ol>
            <small>Revezem o controle a cada sala.</small>
        </section>`;
}

function mission() {
    const r = run.room;
    return `<div class="escape-page">${heading('Guardiões da Energia Digital', `Operação em andamento · ${esc(run.team)}`, '<span class="chip amber">Ataque fictício</span>')}<div class="escape-hud">
<div>
<span class="status-dot">
</span>
<strong>OPERAÇÃO GUARDIÃO</strong>
<small>${run.stage}/5 barreiras protegidas</small>
</div>
<div class="escape-timer" role="timer" aria-label="Tempo restante da missão">
<span>${icon('clock')} TEMPO RESTANTE</span>
<strong id="escape-clock">${clockText(run.remaining)}</strong>
</div>
<div class="escape-hud-stat">
<strong>${run.mistakes}</strong>
<span>tentativas a revisar</span>
</div>
</div>
<div class="escape-time-track">
<span id="escape-time-fill" style="width:${Math.max(0,run.remaining/run.duration*100)}%">
</span>
</div>${routeMap()}<div id="escape-feedback" aria-live="polite">${run.last_feedback?`<div class="escape-feedback">
<strong>${run.stage?'Registro da missão':'Mensagem da central'}</strong>
<p>${esc(run.last_feedback)}</p>
</div>`:''}</div>
<div class="escape-game-grid">
<section class="escape-room">
<div class="escape-room-heading">
<span class="card-icon">${icon(r?r.icon:'bolt')}</span>
<div>
<p class="eyebrow">${r?'SALA '+String(run.stage+1).padStart(2,'0')+' / '+esc(r.zone).toUpperCase():'ETAPA FINAL / CENTRO DE RESPOSTA'}</p>
<h2>${esc(r?r.title:run.final.title)}</h2>
</div>
</div>
<p class="escape-story">${esc(r?r.story:run.final.story)}</p>${r?`<div class="escape-transmission">${mask()}<div>
<span>TRANSMISSÃO DO ADVERSÁRIO</span>
<p>${esc(r.transmission)}</p>
</div>
</div>`:'<div class="escape-final-signal">'+icon('shield')+'<strong>Cinco barreiras recuperadas<br>Falta uma decisão coletiva</strong></div>'}<form id="escape-answer-form">${r?`<fieldset class="escape-evidence">
<legend>
<span class="eyebrow">ANALISEM AS EVIDÊNCIAS</span>${esc(r.evidence_prompt)}</legend>
<p class="selection-help">Selecione exatamente ${r.selection_count} pistas.</p>
<div class="escape-dossiers">${r.evidence.map(e=>`<label class="escape-dossier">
<div>
<span>ARQUIVO ${esc(e.mark)}</span>
<input type="checkbox" name="evidence" value="${e.id}" aria-label="Selecionar pista: ${esc(e.label)}">
</div>
<strong>${esc(e.label)}</strong>
<p>${esc(e.content)}</p>
<span class="dossier-select">Marcar como evidência</span>
</label>`).join('')}</div>
</fieldset>`:`<div class="escape-code">
<label for="escape-code-input">Código de proteção</label>
<p>Reúnam os cinco dígitos do inventário, na ordem das salas 01 → 05.</p>
<input id="escape-code-input" name="code" inputmode="numeric" type="text" pattern="[0-9]{5}" maxlength="5" minlength="5" placeholder="_ _ _ _ _" autocomplete="off" required aria-describedby="escape-code-help">
<small id="escape-code-help">Código fictício do jogo. Não use senhas reais.</small>
</div>`}<fieldset class="escape-decision">
<legend>${esc(r?r.question:'Qual protocolo impede a última manobra do Hacker Apagão?')}</legend>
<div class="choices">${(r?r.choices:run.final.choices).map((c,i)=>`<label class="choice">
<input type="radio" name="choice" value="${i}" required>
<span>${esc(c)}</span>
</label>`).join('')}</div>
</fieldset>
<button class="button primary wide" type="submit">${icon('shield')}${r?'Confirmar decisão da equipe':'Ativar protocolo Guardião'} →</button>
<p class="error" role="alert">
</p>
</form>
</section>
<aside>${team()}${inventory()}${r?`<section class="escape-hint">${icon('spark')}<h3>Precisam de uma pista?</h3>${run.hint_used?`<p>${esc(run.hint)}</p>
<small>Dica já utilizada · nenhuma nova cobrança</small>`:`<details>
<summary>Ver condições da dica</summary>
<p>A central pode ajudar. Solicitar a dica desconta <strong>1 minuto</strong> do tempo restante, uma única vez nesta sala.</p>
<button class="button ghost small" data-escape="hint">Pedir dica · −1 minuto</button>
</details>`}</section>`:''}<p class="fineprint">A contagem continua ao trocar de página. Progresso salvo automaticamente neste perfil.</p>
</aside>
</div>
<p class="fineprint">Em uma ocorrência real, sigam os canais e os procedimentos da organização. Este jogo não executa bloqueios, desligamentos ou ações em sistemas reais.</p>
</div>`;
}

function outcome() {
    const won = run.status === 'won';
    return `<div class="escape-page">${heading('Operação encerrada', 'Guardiões da Energia Digital · Relatório da equipe')}<section class="escape-result ${won?'won':'expired'}">
<div class="escape-result-emblem">${icon(won?'shield':'clock')}</div>
<p class="eyebrow">${won?'MISSÃO CUMPRIDA':'A SIMULAÇÃO CHEGOU AO FIM'}</p>
<h2>${won?'A energia digital<br>continua protegida':'O tempo terminou<br>O aprendizado continua'}</h2>
<p>${won?`A equipe ${esc(run.team)} reuniu os cinco fragmentos e impediu o ataque fictício do Hacker Apagão com uma resposta coordenada.`:'A equipe não concluiu o protocolo dentro do tempo. Revisem as decisões e iniciem outra tentativa quando estiverem prontos.'}</p>${won?`<div class="escape-stars" aria-label="${run.stars} de 3 estrelas da missão">${'★'.repeat(run.stars)}<span>${'☆'.repeat(3-run.stars)}</span>
</div>
<p class="escape-reward">${run.xp?'+'+run.xp+' XP · Conquista Guardiões da Energia desbloqueada':'Conquista já registrada · prática sem XP duplicado'}</p>`:''}<div class="escape-result-stats">
<div>
<strong>${run.stage}/5</strong>
<span>barreiras protegidas</span>
</div>
<div>
<strong>${clockText(run.remaining)}</strong>
<span>tempo restante</span>
</div>
<div>
<strong>${run.mistakes}</strong>
<span>tentativas a revisar</span>
</div>
<div>
<strong>${run.hint_count}</strong>
<span>dicas utilizadas</span>
</div>
</div>
<div class="actions">
<button class="button primary" data-escape="briefing">Preparar nova missão →</button>
<a class="button ghost" href="#conquistas">Ver minhas conquistas</a>
</div>${won?'<small>Estrelas da equipe: 3 ao concluir; −1 se houve erro; −1 se houve dica. Todos podem praticar novamente.</small>':''}</section>
<div class="section-title lower-section">
<div>
<h2>Levem estas decisões para o dia a dia</h2>
<p>Conversem sobre o que mudou na forma de reconhecer os riscos.</p>
</div>
</div>
<div class="escape-debrief">${run.debrief.map((r,i)=>`<article>
<span class="step-number ${r.solved?'done':''}">${r.solved?'✓':i+1}</span>
<div>
<h3>${esc(r.title)}</h3>
<p>${esc(r.learning)}</p>
<small>${r.solved?'Barreira protegida na missão':'Tema para reforçar na próxima tentativa'}</small>
</div>
</article>`).join('')}</div>
<div class="notice lower-section">
<strong>Pergunta para a equipe:</strong> qual sinal vocês poderiam deixar passar em um dia corrido? Qual canal oficial usariam para confirmar ou reportar?</div>
</div>`;
}
async function render() {
    const result = await api('escape');
    run = result.run;
    if (run?.status === 'active') briefing = false;
    return !run || briefing ? intro() : run.status === 'active' ? mission() :
        outcome();
}

function stop() {
    clearInterval(timer);
    clearInterval(synchronizer);
    timer = null;
    synchronizer = null;
}

function remaining() {
    return Math.max(0, baseline - Math.floor((performance.now() - observed) /
        1000));
}

function tick() {
    const value = remaining(),
        el = $('#escape-clock');
    if (!el) return;
    el.textContent = clockText(value);
    el.parentElement.classList.toggle('urgent', value <= 120);
    const fill = $('#escape-time-fill');
    if (fill) fill.style.width = Math.min(100, value / run.duration * 100) + '%';
    if (value === 0 && !pending && performance.now() - lastExpiryCheck > 10000) {
        lastExpiryCheck = performance.now();
        sync();
    }
}

function mount() {
    stop();
    if (!run || run.status !== 'active' || view() !== 'escape') return;
    baseline = run.remaining;
    observed = performance.now();
    tick();
    timer = setInterval(tick, 1000);
    synchronizer = setInterval(sync, 15000);
}
async function sync() {
    if (syncing || pending || view() !== 'escape' || !state?.user) return;
    syncing = true;
    try {
        const fresh = (await api('escape')).run;
        if (view() !== 'escape') return;
        if (!fresh || fresh.id !== run?.id || fresh.status !== run?.status ||
            fresh.stage !== run?.stage) {
            await renderPage();
        } else {
            run = fresh;
            baseline = run.remaining;
            observed = performance.now();
        }
    } catch (e) {
        const el = $('#escape-feedback');
        if (el) el.innerHTML = `<div class="escape-feedback error">${esc(e.message)} O tempo continua no servidor. <button class="text-link" data-escape="sync">Tentar reconectar</button>
</div>`;
    } finally {
        syncing = false;
    }
}
async function submit(form) {
    if (pending) return;
    const isStart = form.id === 'escape-start-form';
    const data = new FormData(form);
    if (!isStart && run.room && data.getAll('evidence').length !== run.room
        .selection_count) {
        $('.error', form).textContent =
            `Marquem exatamente ${run.room.selection_count} pistas antes de confirmar.`;
        return;
    }
    pending = true;
    const button = $('button[type=submit]', form);
    button.disabled = true;
    try {
        const result = await api(isStart ? 'escape/start' : 'escape/answer',
            isStart ? {
                team: data.get('team'),
                members: Number(data.get('members')),
                minutes: Number(data.get('minutes'))
            } : {
                run_id: run.id,
                stage: run.stage,
                evidence: data.getAll('evidence'),
                choice: Number(data.get('choice')),
                code: data.get('code')
            });
        run = result.run;
        baseline = run.remaining;
        observed = performance.now();
        briefing = false;
        if (isStart || result.correct || run.status !== 'active') {
            await refresh();
            if (result.correct && run.status === 'active') toast(
                'Barreira protegida! Um novo fragmento entrou no inventário.'
            );
            $('#content').focus();
            window.scrollTo(0, 0);
        } else {
            $('#escape-feedback').innerHTML = `<div class="escape-feedback retry" role="alert">
<strong>Reúnam a equipe e tentem novamente</strong>
<p>${esc(result.feedback)}</p>
</div>`;
            $('#escape-feedback').scrollIntoView({
                behavior: 'auto',
                block: 'center'
            });
            tick();
        }
    } catch (e) {
        $('.error', form).textContent = e.message;
    } finally {
        pending = false;
        button.disabled = false;
    }
}
document.addEventListener('submit', event => {
    if (['escape-start-form', 'escape-answer-form'].includes(event.target
            .id)) {
        event.preventDefault();
        submit(event.target);
    }
});
document.addEventListener('click', async event => {
    const button = event.target.closest('[data-escape]');
    if (!button || pending) return;
    const action = button.dataset.escape;
    if (action === 'briefing') {
        briefing = true;
        await renderPage();
        window.scrollTo(0, 0);
        return;
    }
    if (action === 'result') {
        briefing = false;
        await renderPage();
        return;
    }
    if (action === 'sync') {
        await sync();
        return;
    }
    if (action === 'hint') {
        pending = true;
        button.disabled = true;
        try {
            const result = await api('escape/hint', {
                run_id: run.id,
                stage: run.stage
            });
            run = result.run;
            await renderPage();
        } catch (e) {
            toast(e.message);
        } finally {
            pending = false;
            button.disabled = false;
        }
    }
});
document.addEventListener('visibilitychange', () => {
    if (!document.hidden && typeof view === 'function' && view() ===
        'escape') sync();
});

export default {
    render,
    mount,
    stop
};
