import { heading } from './components.js';

export function interactiveGame() {
    return heading('Missão interativa', 'Enfrente o Hacker Apagão no jogo EquaGuard') + `
<a class="button primary" href="https://equaguard-versao-ii-production.up.railway.app/">Abrir missão ↗</a>
<p class="practice-note">O jogo tem pontuação própria, separada do XP da plataforma</p>`;
}
