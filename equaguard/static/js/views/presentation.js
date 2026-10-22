import { icon } from '../icons.js';

export function presentation() {
    return `<div class="equaguard-presentation">
<header class="orbital-header">
    <a class="orbital-brand" href="#inicio">Equa<span>Guard</span></a>
    <nav class="orbital-nav" aria-label="Navegação da plataforma">
        <a href="#inicio">Início</a><a href="#aprender">Aprender</a><a href="#simular">Praticar</a><a href="#guardia">GuardIA</a>
    </nav>
    <a class="button primary" href="#escape">Jogar Escape Room ↗</a>
</header>
<section class="presentation-hero" aria-labelledby="presentation-title">
    <div>
        <p class="eyebrow">EQUAGUARD · DESAFIO 237</p>
        <h1 id="presentation-title">Segurança digital começa com <em>pessoas preparadas</em></h1>
        <p>Uma jornada de cibersegurança para colaboradores do Grupo Equatorial. Aprenda com situações da rotina, pratique decisões seguras e transforme conhecimento em proteção.</p>
        <div class="presentation-actions"><a class="button primary" href="https://equaguard-versao-ii-production.up.railway.app/">Missão interativa ↗</a><a class="button ghost" href="#escape">Começar a aprender →</a></div>
    </div>
    <aside class="presentation-shield" aria-label="Resumo do EquaGuard">
        <p class="eyebrow">GUARDIÕES DA ENERGIA DIGITAL</p>
        <div class="presentation-orbit">${icon('shield')}</div>
        <div class="presentation-facts"><div><small>FOCO</small><strong>Cultura digital</strong></div><div><small>EXPERIÊNCIA</small><strong>Aprender jogando</strong></div><div><small>MISSÃO</small><strong>Proteger pessoas</strong></div></div>
    </aside>
</section>
<section class="presentation-section" aria-labelledby="path-title">
    <p class="eyebrow">DO CONHECIMENTO À PRÁTICA</p><h2 id="path-title">Uma jornada, três formas de evoluir</h2>
    <div class="presentation-features">
        <a href="#aprender"><span>01</span><h3>Aprenda no seu ritmo</h3><p>Lições curtas sobre phishing, senhas, dados e dispositivos</p><strong>Explorar EquaLearn →</strong></a>
        <a href="#simular"><span>02</span><h3>Pratique decisões</h3><p>Simulações com feedback para reconhecer riscos do cotidiano</p><strong>Acessar EquaSim →</strong></a>
        <a href="#escape"><span>03</span><h3>Assuma a missão</h3><p>Cinco salas contra o Hacker Apagão, sozinho ou em equipe</p><strong>Jogar Escape Room →</strong></a>
    </div>
</section>
<section class="presentation-support"><div><p class="eyebrow">APOIO NA JORNADA</p><h2>Uma dúvida pode virar aprendizado</h2><p>Consulte orientações educativas com a GuardIA e acompanhe suas conquistas</p></div><a class="button ghost" href="#guardia">Conversar com GuardIA →</a></section>
</div>`;
}
