from flask import Blueprint, jsonify
from ..http import error, payload, require_user
import unicodedata
from ..content.learning import FAQ

bp = Blueprint("assistant", __name__)


@bp.post("/api/guardia")
@require_user
def guardia():
    question = payload().get("question")
    if not isinstance(question, str) or not 2 <= len(question.strip()) <= 400:
        return error("Digite uma dúvida entre 2 e 400 caracteres.")
    normalized = "".join(
        c
        for c in unicodedata.normalize("NFD", question.lower())
        if unicodedata.category(c) != "Mn"
    )
    match = max(FAQ, key=lambda f: sum(k in normalized for k in f["keywords"]))
    if not any(k in normalized for k in match["keywords"]):
        return jsonify(
            answer="Minha base educativa cobre phishing, senhas e MFA, engenharia social, dados e dispositivos. Escolha uma dessas dúvidas abaixo. Para uma ocorrência real ou uma política interna, procure o canal oficial da sua organização.",
            lesson=None,
        )
    return jsonify(answer=match["answer"], lesson=match["topic"])
