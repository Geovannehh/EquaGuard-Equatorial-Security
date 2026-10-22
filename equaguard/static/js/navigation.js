import {
    api,
    state,
    view,
    toast
} from './core.js';

let renderCurrentPage;

export function setRenderer(renderer) {
    renderCurrentPage = renderer;
}

export async function renderPage() {
    await renderCurrentPage();
}

export async function refresh() {
    state.progress = await api('progress');
    await renderPage();
}

export function navigate(id) {
    if (view() === id) {
        return renderPage().catch(error => toast(error.message));
    }
    location.hash = id;
}
