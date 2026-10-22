"""Conexão SQLite por contexto e criação aditiva das tabelas."""

import sqlite3
from pathlib import Path

import click
from flask import current_app, g


def get_db():
    if "db" not in g:
        g.db = sqlite3.connect(current_app.config["DATABASE"], timeout=15)
        g.db.row_factory = sqlite3.Row
        g.db.execute("PRAGMA foreign_keys=ON")
    return g.db


def close_db(error=None):
    connection = g.pop("db", None)
    if connection is not None:
        connection.close()


def init_db():
    schema = Path(__file__).with_name("schema.sql").read_text(encoding="utf-8")
    get_db().executescript(schema)
    get_db().commit()


def init_app(app):
    app.teardown_appcontext(close_db)
    app.cli.command("init-db")(init_db_command)
    with app.app_context():
        init_db()


def init_db_command():
    init_db()
    click.echo("Tabelas do EquaGuard verificadas.")
