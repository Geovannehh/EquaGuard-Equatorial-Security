import {
    esc,
    state,
    chatHistory
} from '../core.js';
import {
    icon
} from '../icons.js';
import {
    heading
} from './components.js';

export function chatMessages() {
    return chatHistory.map(m =>
        `<div class="message ${m.user?'user':''}">${esc(m.user||m.answer)}${m.lesson?`<button class="text-link" data-action="lesson" data-id="${m.lesson}">Estudar este tema →</button>`:''}</div>`
    ).join('');
}

export function guardiaView() {
    return heading('Uma orientação na hora da dúvida',
        'GuardIA · Apoio educativo com respostas claras e trilhas para continuar') + `<div class="chat-layout">
<section class="chat">
<div class="chat-head">
<span class="assistant-symbol">${icon('spark')}</span>
<div>
<h2>Converse com a GuardIA</h2>
<p>Base educativa de perguntas e respostas · Sem IA generativa</p>
</div>
</div>
<div class="messages" id="messages" role="log" aria-label="Conversa com a GuardIA" aria-live="polite">${chatMessages()}</div>
<form id="chat-form">
<label class="skip" for="chat-input">Sua dúvida</label>
<input id="chat-input" name="question" type="text" minlength="2" maxlength="400" placeholder="Ex.: como identificar phishing?" required autocomplete="off">
<button class="button primary" type="submit">Enviar →</button>
</form>
</section>
<aside>
<div class="section-title">
<h2>Comece por uma dúvida</h2>
</div>${state.faq.map((f,i)=>`<button class="faq-button" data-action="faq" data-id="${i}">${esc(f.question)} <span class="cyan">↗</span>
</button>`).join('')}<p class="fineprint">As orientações são gerais e educativas. Para políticas internas ou incidentes reais, use os canais oficiais da organização. Não informe dados pessoais, senhas ou informações de clientes.</p>
</aside>
</div>`;
}
