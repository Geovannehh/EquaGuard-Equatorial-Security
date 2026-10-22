from flask import Blueprint, jsonify, render_template

bp = Blueprint("pages", __name__)


@bp.get("/")
@bp.get("/admin")
def index():
    return render_template("index.html")


@bp.get("/health")
def health():
    return jsonify(service="equaguard", status="ok")
