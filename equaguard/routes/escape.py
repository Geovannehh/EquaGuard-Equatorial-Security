from flask import Blueprint, jsonify, session
from ..database import get_db
from ..http import error, payload, require_user
import json
import secrets
from ..content.escape import ROOMS, FINAL
from ..services.learning import award
from ..services import escape_room as clock
from ..services.escape_room import latest, expire, public, locked_run

bp = Blueprint("escape", __name__)


@bp.get("/api/escape")
@require_user
def escape_state():
    get_db().execute("BEGIN IMMEDIATE")
    run = expire(latest())
    get_db().commit()
    return jsonify(run=public(run))


@bp.post("/api/escape/start")
@require_user
def escape_start():
    data = payload()
    team = data.get("team", "")
    members, minutes = data.get("members"), data.get("minutes")
    if (
        not isinstance(team, str)
        or not 2 <= len(team.strip()) <= 32
        or any(ord(c) < 32 for c in team)
        or type(members) is not int
        or members not in range(1, 7)
        or type(minutes) is not int
        or minutes not in (20, 30)
    ):
        return error(
            "Escolha um nome de equipe de 2 a 32 caracteres, de 1 a 6 participantes e 20 ou 30 minutos."
        )
    get_db().execute("BEGIN IMMEDIATE")
    previous = expire(latest())
    if previous and previous["status"] == "active":
        get_db().commit()
        return jsonify(run=public(previous), resumed=True)
    started_at = clock.now()
    get_db().execute(
        "INSERT INTO escape_runs(id,user_id,team,members,duration,started,deadline) VALUES(?,?,?,?,?,?,?)",
        (
            secrets.token_hex(16),
            session["uid"],
            team.strip(),
            members,
            minutes * 60,
            started_at,
            started_at + minutes * 60,
        ),
    )
    get_db().commit()
    return jsonify(run=public(latest()), resumed=False)


@bp.post("/api/escape/hint")
@require_user
def escape_hint():
    run, failure = locked_run(payload())
    if failure is not None:
        return failure
    stage = run["stage"]
    if stage >= len(ROOMS):
        get_db().rollback()
        return error("Use os fragmentos das salas 01 a 05, na ordem, no painel final.")
    hints = json.loads(run["hints"])
    if stage not in hints:
        hints.append(stage)
        get_db().execute(
            "UPDATE escape_runs SET hints=?,deadline=deadline-60 WHERE id=?",
            (json.dumps(hints), run["id"]),
        )
    run = expire(latest())
    get_db().commit()
    return jsonify(run=public(run))


@bp.post("/api/escape/answer")
@require_user
def escape_answer():
    data = payload()
    run, failure = locked_run(data)
    if failure is not None:
        return failure
    stage = run["stage"]
    choice = data.get("choice")
    if type(choice) is not int or choice not in range(3):
        get_db().rollback()
        return error("Selecione a decisão da equipe.")
    if stage < len(ROOMS):
        room = ROOMS[stage]
        evidence = data.get("evidence")
        allowed = [x["id"] for x in room["evidence"]]
        if (
            not isinstance(evidence, list)
            or any(not isinstance(x, str) or x not in allowed for x in evidence)
            or len(evidence) != len(room["evidence_answer"])
            or len(set(evidence)) != len(evidence)
        ):
            get_db().rollback()
            return error(
                f"Marque exatamente {len(room['evidence_answer'])} pistas diferentes."
            )
        correct = (
            set(evidence) == set(room["evidence_answer"]) and choice == room["answer"]
        )
        feedback = (
            room["learning"]
            if correct
            else "A combinação de pistas e decisão ainda deixa uma brecha. Releiam os documentos e debatam a alternativa mais segura. Penalidade: 30 segundos."
        )
    else:
        code = data.get("code")
        if (
            not isinstance(code, str)
            or len(code.strip()) != len(ROOMS)
            or not code.strip().isdigit()
        ):
            get_db().rollback()
            return error("Digite os cinco dígitos do inventário na ordem das salas.")
        correct = (
            code.strip() == "".join(r["fragment"] for r in ROOMS)
            and choice == FINAL["answer"]
        )
        feedback = (
            FINAL["learning"]
            if correct
            else "O código ou o protocolo ainda não protege a operação. Confiram a ordem dos fragmentos e a resposta coordenada. Penalidade: 30 segundos."
        )
    xp = 0
    if correct and stage == len(ROOMS):
        xp = award("escape:guardian", 250)
        get_db().execute(
            "UPDATE escape_runs SET status='won',finished=?,last_feedback=?,xp=? WHERE id=?",
            (clock.now(), feedback, xp, run["id"]),
        )
    elif correct:
        get_db().execute(
            "UPDATE escape_runs SET stage=stage+1,last_feedback=? WHERE id=?",
            (feedback, run["id"]),
        )
    else:
        get_db().execute(
            "UPDATE escape_runs SET mistakes=mistakes+1,deadline=deadline-30,last_feedback=? WHERE id=?",
            (feedback, run["id"]),
        )
    run = expire(latest())
    get_db().commit()
    return jsonify(correct=correct, feedback=feedback, xp=xp, run=public(run))
