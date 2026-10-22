from flask import Blueprint, jsonify, session
from ..http import error, require_user
from ..services.analytics import get_analytics

bp = Blueprint("analytics", __name__)


@bp.get("/api/analytics")
@require_user
def analytics():
    if session.get("role") != "manager":
        return error(
            "Entre no perfil de gestão demonstrativa para acessar os indicadores agregados.",
            403,
        )
    return jsonify(get_analytics())
