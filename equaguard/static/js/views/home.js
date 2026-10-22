import {
    icon
} from '../icons.js';

export function home() {
    return `<div class="orbital-home">
 <header class="orbital-header orbital-header-minimal">
<a class="orbital-brand" href="#inicio" aria-label="EquaGuard — início">Equa<span>Guard</span>
</a>
</header>
 <section class="orbital-hero" aria-labelledby="orbital-title">
<div class="orbital-halo" aria-hidden="true">
</div>
<div class="orbital-mark" aria-hidden="true">${icon('bolt')}</div>
<p class="orbital-kicker">Guardiões da Energia Digital</p>
<h1 id="orbital-title">A próxima defesa<br>é <em>você</em>
</h1>
<p class="orbital-description">Cinco desafios, sozinho ou em equipe. Decifrem as pistas do Hacker Apagão e protejam a energia que conecta pessoas.</p>
<a class="button primary orbital-cta" href="#plataforma">Entrar na missão <span aria-hidden="true">↗</span>
</a>
<p class="orbital-meta">1–6 participantes · 20 ou 30 minutos · Escape Room</p>
</section>
 <section class="orbital-bottom" aria-label="Aprendizagem individual">
<div>
<strong>Aprenda, pratique e proteja</strong>
<p>Pequenas decisões, proteção coletiva</p>
</div>
<a href="#plataforma">Conhecer a plataforma</a><a href="#aprender">Prefiro começar pelas lições <span aria-hidden="true">→</span>
</a>
</section>
 </div>`;
}
