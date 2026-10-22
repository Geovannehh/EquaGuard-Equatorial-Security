# Organização do EquaGuard

## Backend

`create_app()` configura o Flask, inicializa o esquema aditivo do SQLite e registra os blueprints. Importar o pacote `equaguard` não cria conexões nem aplicações globais. `flask_app.py` permanece como entrada local e WSGI.

- `config.py`: ambiente, caminhos e sessão.
- `database.py` e `schema.sql`: conexão por contexto e criação das tabelas.
- `http.py`: CSRF, sessão, validação de JSON e cabeçalhos.
- `routes/`: contratos HTTP, validação de entrada e respostas JSON.
- `services/`: progresso, recompensas, indicadores e estado das partidas.
- `content/`: conteúdo educativo e gabaritos usados somente no servidor.

As rotas e o formato dos dados permanecem compatíveis. O jogo usa `BEGIN IMMEDIATE` para serializar as decisões de uma partida. O servidor valida prazo, sequência e pontuação.

## Navegador

ES modules são carregados diretamente pelo navegador, sem compilação e sem Node.js em produção.

- `app.js`: inicialização, eventos e seleção da página.
- `core.js`: cliente HTTP, estado da sessão e utilitários.
- `navigation.js`: atualização dos dados e comunicação com o renderizador, sem importações circulares.
- `views/`: uma página por módulo e componentes compartilhados.
- `activities.js`: formulários, feedback e conversa educativa.
- `escape.js`: interface, sincronização e cronômetro da missão.
- `icons.js`: catálogo de vetores da interface.

O CSS é dividido em base, layout, componentes, responsividade e páginas. Navegação e diálogos são parciais Jinja.

## Dados e testes

O banco e o segredo de sessão continuam em `instance/`, na raiz. `EQUAGUARD_DATABASE` permite outro caminho. A reorganização não recria perfis nem zera recompensas.

Cada teste cria uma aplicação e um banco temporário. Não há dependência da ordem de execução nem uso do banco real.

## Convenções

Use nomes que expressem a regra de negócio e comentários que expliquem decisões ou restrições. Acrescente testes quando alterar um comportamento observável, especialmente pontuação, prazo, permissões e exposição dos gabaritos.

O legado fica em `legacy/conecta-campus/`; cópias locais de recuperação ficam em `backups/`. Nenhuma dessas pastas participa da execução.
