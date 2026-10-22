export const $ = (s, root = document) => root.querySelector(s);
export const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
} [c]));
export const titles = {
    inicio: 'Minha jornada',
    plataforma: 'Conheça o EquaGuard',
    aprender: 'EquaLearn',
    simular: 'EquaSim',
    escape: 'Escape Room',
    jogo: 'Missão interativa',
    guardia: 'GuardIA',
    conquistas: 'Minhas conquistas',
    insights: 'EquaInsights'
};
export let state;
export const ui = {
    filter: 'all',
    busy: false,
    activity: null,
    renderId: 0
};
export function setState(value) {
    state = value;
}
let toastTimer;
export const chatHistory = [{
    answer: 'Olá! Sou a GuardIA, sua guia de aprendizagem. Posso ajudar com phishing, senhas, engenharia social, proteção de dados e dispositivos. Qual situação você quer entender?'
}];
export const view = () => Object.prototype.hasOwnProperty.call(titles, location.hash.slice(1)) ? location.hash.slice(1) : 'inicio';
export async function api(path, data) {
    const response = await fetch('/api/' + path, {
        method: data === undefined ? 'GET' : 'POST',
        headers: data === undefined ? {} : {
            'Content-Type': 'application/json',
            'X-CSRF-Token': state?.csrf || ''
        },
        ...(data === undefined ? {} : {
            body: JSON.stringify(data)
        })
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error ||
        'Não foi possível concluir. Tente novamente.');
    return result;
}
export function toast(message) {
    const el = $('#toast');
    el.textContent = message;
    el.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.hidden = true, 4500);
}
