from flask import Blueprint, jsonify, session
from ..database import get_db
from ..http import error, payload
import secrets
from ..content.learning import PROFILES, LESSONS, SCENARIOS, DIAGNOSTICS, FAQ
from ..services.learning import progress

bp = Blueprint("session", __name__)


@bp.get("/api/bootstrap")
def bootstrap():
    session.setdefault("csrf", secrets.token_hex(24))
    user = None
    if session.get("uid"):
        row = (
            get_db()
            .execute("SELECT profile FROM learners WHERE id=?", (session["uid"],))
            .fetchone()
        )
        if row:
            user = dict(PROFILES[row["profile"]], profile=row["profile"])
    return jsonify(
        csrf=session["csrf"],
        user=user,
        role=session.get("role", "learner"),
        profiles=PROFILES,
        lessons=[
            {k: v for k, v in x.items() if k not in ("answer", "feedback")}
            for x in LESSONS
        ],
        scenarios=[
            {
                k: v
                for k, v in x.items()
                if k
                not in (
                    "answer",
                    "feedback",
                    "branches",
                    "followup_choices",
                    "followup_answers",
                    "followup_feedback",
                )
            }
            for x in SCENARIOS
        ],
        diagnostics={
            key: [{k: v for k, v in x.items() if k != "answer"} for x in items]
            for key, items in DIAGNOSTICS.items()
        },
        faq=[{"question": f["question"]} for f in FAQ],
        progress=progress() if user else None,
    )


@bp.post("/api/login")
def login():
    data = payload()
    profile = data.get("profile")
    if (
        not isinstance(profile, str)
        or profile not in PROFILES
        or data.get("role") not in ("learner", "manager")
    ):
        return error("Selecione um perfil de demonstração válido.")
    known = session.get("known", {})
    uid = known.get(profile) or secrets.token_hex(16)
    get_db().execute("INSERT OR IGNORE INTO learners VALUES(?,?)", (uid, profile))
    get_db().commit()
    known[profile] = uid
    session.update(uid=uid, known=known, role=data["role"], pending={})
    session.permanent = True
    return jsonify(ok=True)


@bp.post("/api/logout")
def logout():
    session.pop("uid", None)
    session.pop("pending", None)
    return jsonify(ok=True)
