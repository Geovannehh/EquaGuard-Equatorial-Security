"""Validação comum das requisições e proteção da sessão."""

import secrets
from functools import wraps
from flask import jsonify, request, session
from werkzeug.exceptions import HTTPException
from .database import get_db


def error(message, status=400):
    return jsonify(error=message), status


def payload():
    data = request.get_json(silent=True)
    return data if isinstance(data, dict) else {}


def require_user(fn):
    @wraps(fn)
    def wrapped(*args, **kwargs):
        if (
            not session.get("uid")
            or not get_db()
            .execute("SELECT 1 FROM learners WHERE id=?", (session["uid"],))
            .fetchone()
        ):
            return error("Entre com um perfil de demonstração para continuar.", 401)
        return fn(*args, **kwargs)

    return wrapped


def protect_mutations():
    if request.method == "POST":
        if not request.is_json:
            return error("Envie uma solicitação JSON.", 415)
        token = session.get("csrf")
        if not token or not secrets.compare_digest(
            request.headers.get("X-CSRF-Token", ""), token
        ):
            return error("Atualize a página para renovar sua sessão.", 403)


def headers(response):
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["Referrer-Policy"] = "same-origin"
    response.headers["Content-Security-Policy"] = (
        "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; frame-src 'none'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'"
    )
    if request.path.startswith("/static/") or request.path == "/":
        response.headers["Cache-Control"] = "no-cache"
    if request.path.startswith("/api/"):
        response.headers["Cache-Control"] = "no-store"
    return response


def http_error(exc):
    if request.path.startswith("/static/") or request.path == "/":
        response.headers["Cache-Control"] = "no-cache"
    if request.path.startswith("/api/"):
        return error("Solicitação inválida ou recurso indisponível.", exc.code)
    return exc


def init_app(app):
    app.before_request(protect_mutations)
    app.after_request(headers)
    app.register_error_handler(HTTPException, http_error)
