import {
    $,
    state,
    ui,
    setState,
    api,
    esc,
    toast,
    titles,
    view,
    chatHistory
} from './core.js';
import {
    icon
} from './icons.js';
import {
    home
} from './views/home.js';
import {
    learning
} from './views/learning.js';
import {
    simulations
} from './views/simulations.js';
import {
    achievements
} from './views/achievements.js';
import {
    guardiaView
} from './views/assistant.js';
import {
    insights
} from './views/insights.js';
import {
    lesson,
    scenario,
    assessment,
    nextStep,
    submitActivity,
    ask,
    scrollChat
} from './activities.js';
import Escape from './escape.js';
import { presentation } from './views/presentation.js';
import { interactiveGame } from './views/game.js';
import {
    setRenderer,
    navigate
} from './navigation.js';

document.querySelectorAll('[data-icon]').forEach(el => el.innerHTML = icon(el.dataset.icon));
async function load() {
    setState(await api('bootstrap'));
    const avatar = $('#avatar');
    avatar.replaceChildren();
    if (state.user?.photo) {
        const photo = document.createElement('img');
        photo.src = '/static/' + state.user.photo;
        photo.alt = '';
        avatar.append(photo);
    } else avatar.textContent = state.user?.initials || 'EG';
    const selectedProfile = document.querySelector(`#login-form input[value="${state.user?.profile || 'maria'}"]`);
    if (selectedProfile) selectedProfile.checked = true;
    $('#profile-name').textContent = state.user ? `${state.user.name} · Demo` :
        'Entrar no demo';
    if (!state.user) {
        $('#content').innerHTML =
            '<div class="loading">Escolha um perfil fictício para começar sua jornada.</div>';
        if (!$('#login-dialog').open) $('#login-dialog').showModal();
    } else {
        $('#login-dialog').close();
        await render();
    }
}
export async function render() {
    if (!state?.user) return;
    const id = ++ui.renderId,
        current = view();
    Escape.stop();
    document.body.classList.toggle('home-view', current === 'inicio' || current === 'plataforma');
    document.querySelectorAll('[data-view]').forEach(a => {
        a.classList.toggle('active', a.dataset.view === current);
        if (a.dataset.view === current) a.setAttribute('aria-current', 'page');
        else a.removeAttribute('aria-current');
    });
    $('#page-label').textContent = titles[current];
    document.title = `${titles[current]} • EquaGuard`;
    if (current === 'insights') $('#content').innerHTML =
        '<div class="loading">Consultando os indicadores…</div>';
    const html = current === 'inicio' ? home() : current === 'plataforma' ? presentation() : current === 'aprender' ? learning() :
        current === 'simular' ? simulations() : current === 'jogo' ? interactiveGame() :
        current === 'escape' ? await Escape.render() :
        current === 'guardia' ? guardiaView() : current === 'conquistas' ? achievements() :
        await insights(id);
    if (id === ui.renderId && html !== null) $('#content').innerHTML = html;
    if (id === ui.renderId && current === 'escape') Escape.mount();
    if (current === 'guardia') scrollChat();
}
setRenderer(render);

document.addEventListener('click', async event => {
    const btn = event.target.closest('[data-action]');
    if (!btn || ui.busy) return;
    const {
        action,
        id
    } = btn.dataset;
    try {
        if (action === 'navigate') navigate(id);
        else if (action === 'lesson') lesson(id);
        else if (action === 'scenario') scenario(id);
        else if (action === 'assessment') assessment(id);
        else if (action === 'next') nextStep();
        else if (action === 'close') $('#activity-dialog').close();
        else if (action === 'filter') {
            ui.filter = id;
            await render();
        } else if (action === 'recommendation') {
            await api('recommendation', {
                id
            });
            lesson(id);
        } else if (action === 'faq') await ask(state.faq[Number(id)].question);
        else if (action === 'profile') $('#login-dialog').showModal();
    } catch (e) {
        toast(e.message);
    }
});
document.addEventListener('submit', async event => {
    const form = event.target;
    if (form.id === 'activity-form') {
        event.preventDefault();
        await submitActivity(form);
    } else if (form.id === 'chat-form') {
        event.preventDefault();
        const input = $('#chat-input');
        const value = input.value.trim();
        if (value.length < 2) return;
        input.value = '';
        await ask(value);
    } else if (form.id === 'login-form') {
        event.preventDefault();
        if (ui.busy) return;
        ui.busy = true;
        const button = $('button[type=submit]', form);
        button.disabled = true;
        try {
            const data = new FormData(form);
            await api('login', {
                profile: data.get('profile'),
                role: data.get('role')
            });
            chatHistory.splice(1);
            $('#login-error').textContent = '';
            await load();
            if (data.get('role') === 'manager') navigate('insights');
        } catch (e) {
            $('#login-error').textContent = e.message;
        } finally {
            ui.busy = false;
            button.disabled = false;
        }
    }
});
$('#profile-button').addEventListener('click', () => {
    if (state) $('#login-dialog').showModal();
});
$('#close-activity').addEventListener('click', () => {
    if (!ui.busy) $('#activity-dialog').close();
});
$('#activity-dialog').addEventListener('cancel', e => {
    if (ui.busy) e.preventDefault();
});
$('#login-dialog').addEventListener('cancel', e => {
    if (!state?.user || ui.busy) e.preventDefault();
});
window.addEventListener('hashchange', () => {
    render().catch(e => toast(e.message));
    window.scrollTo(0, 0);
});
load().catch(e => {
    $('#content').innerHTML = `<div class="empty">
<h1>Não foi possível iniciar</h1>
<p>${esc(e.message)}</p>
<p>Confira se o servidor está rodando e atualize a página.</p>
</div>`;
});

const sidebarToggle = document.getElementById('sidebar-toggle');
function setSidebarCollapsed(collapsed) {
    document.body.classList.toggle('sidebar-collapsed', collapsed);
    sidebarToggle.setAttribute('aria-expanded', String(!collapsed));
    const label = collapsed ? 'Expandir menu' : 'Minimizar menu';
    sidebarToggle.setAttribute('aria-label', label);
    sidebarToggle.title = label;
    sidebarToggle.querySelector('span').textContent = collapsed ? '›' : '‹';
}
try {
    setSidebarCollapsed(localStorage.getItem('equaguard.sidebar.collapsed') === 'true');
} catch {
    setSidebarCollapsed(false);
}
sidebarToggle.addEventListener('click', () => {
    const collapsed = !document.body.classList.contains('sidebar-collapsed');
    setSidebarCollapsed(collapsed);
    try {
        localStorage.setItem('equaguard.sidebar.collapsed', String(collapsed));
    } catch { /* A navegação funciona mesmo sem armazenamento disponível. */ }
});
