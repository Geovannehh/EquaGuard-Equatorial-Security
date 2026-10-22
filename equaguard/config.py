"""Configuração local, sessão e caminhos persistentes."""

import os
import secrets
from datetime import timedelta
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent


def configure_app(app, overrides=None):
    instance = PROJECT_ROOT / "instance"
    app.config.from_mapping(
        SECRET_KEY=os.getenv("SECRET_KEY"),
        DATABASE=os.getenv("EQUAGUARD_DATABASE", str(instance / "equaguard.db")),
        MAX_CONTENT_LENGTH=16 * 1024,
        SESSION_COOKIE_HTTPONLY=True,
        SESSION_COOKIE_SAMESITE="Lax",
        SESSION_COOKIE_SECURE=os.getenv("COOKIE_SECURE") == "1",
        PERMANENT_SESSION_LIFETIME=timedelta(days=30),
    )
    if overrides:
        app.config.update(overrides)
    if not app.config["SECRET_KEY"]:
        instance.mkdir(parents=True, exist_ok=True)
        secret_file = instance / ".equaguard_secret"
        if not secret_file.exists():
            secret_file.write_text(secrets.token_hex(32), encoding="utf-8")
        app.config["SECRET_KEY"] = secret_file.read_text(encoding="utf-8")
    database = app.config["DATABASE"]
    if database != ":memory:":
        Path(database).parent.mkdir(parents=True, exist_ok=True)
