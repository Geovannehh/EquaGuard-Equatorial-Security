import {
    state
} from '../core.js';
import {
    heading,
    scenarioCard
} from './components.js';

export function simulations() {
    return heading('Aqui, você pode errar para aprender',
        'EquaSim · Cenários da rotina de uma distribuidora, sem risco real',
        '<span class="chip cyan">Prática controlada</span>') + `<div class="notice">
<strong>Ambiente simulado:</strong> Nenhuma mensagem é enviada e nenhum link externo é aberto. As decisões mudam o próximo passo do cenário.</div>
<section class="interactive-game-card">
    <span class="chip cyan">Novo jogo</span>
    <h2>Investigue, decida e proteja</h2>
    <p>Entre no escritório virtual do EquaGuard: investigue e-mails suspeitos e pratique a proteção de senhas e do posto de trabalho.</p>
    <a class="button primary" href="https://equaguard-versao-ii-production.up.railway.app/">Jogar missão interativa</a>
</section>
<div class="cards">${state.scenarios.map(scenarioCard).join('')}</div>`;
}
