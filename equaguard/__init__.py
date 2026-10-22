"""Fábrica da aplicação EquaGuard."""

from flask import Flask
from . import database, http
from .config import PROJECT_ROOT, configure_app


def create_app(config=None):
    app = Flask(__name__, instance_path=str(PROJECT_ROOT / "instance"))
    configure_app(app, config)
    database.init_app(app)
    http.init_app(app)
    from .routes import analytics, assistant, escape, learning, pages, session

    for module in (pages, session, learning, assistant, analytics, escape):
        app.register_blueprint(module.bp)
    return app
