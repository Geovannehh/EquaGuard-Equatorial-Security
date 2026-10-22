from flask import Blueprint, jsonify, session
from ..database import get_db
from ..http import error, payload, require_user
from ..content.learning import LESSONS, SCENARIOS, DIAGNOSTICS
from ..services.learning import award, record, progress

bp = Blueprint("learning", __name__)


@bp.get("/api/progress")
@require_user
def user_progress():
    return jsonify(progress())


@bp.post("/api/assessment")
@require_user
def assessment():
    data = payload()
    phase = data.get("phase")
    answers = data.get("answers")
    if (
        not isinstance(phase, str)
        or phase not in DIAGNOSTICS
        or not isinstance(answers, list)
        or len(answers) != 3
        or any(type(a) is not int or a not in range(3) for a in answers)
    ):
        return error("Responda às três perguntas antes de concluir.")
    uid = session["uid"]
    pre = (
        get_db()
        .execute(
            "SELECT score FROM assessments WHERE user_id=? AND phase='pre'", (uid,)
        )
        .fetchone()
    )
    if phase == "pre" and pre:
        return error("Seu diagnóstico inicial já foi registrado.")
    if phase == "post" and (
        not pre
        or not get_db()
        .execute(
            "SELECT 1 FROM awards WHERE user_id=? AND item LIKE 'lesson:%'", (uid,)
        )
        .fetchone()
    ):
        return error(
            "Conclua o diagnóstico e pelo menos uma lição antes da reavaliação."
        )
    score = sum(a == q["answer"] for a, q in zip(answers, DIAGNOSTICS[phase]))
    for a, q in zip(answers, DIAGNOSTICS[phase]):
        record(phase, phase, q["topic"], a == q["answer"])
    get_db().execute(
        "INSERT INTO assessments(user_id,phase,score) VALUES(?,?,?)",
        (uid, phase, score),
    )
    xp = (
        award("assessment:pre", 30)
        if phase == "pre"
        else (award("assessment:improvement", 60) if score > pre["score"] else 0)
    )
    get_db().commit()
    return jsonify(
        score=score,
        xp=xp,
        feedback=f"Você acertou {score} de 3 perguntas. Revise os temas indicados e continue praticando.",
        results=[
            {
                "correct": a == q["answer"],
                "question": q["question"],
                "explanation": q["choices"][q["answer"]],
            }
            for a, q in zip(answers, DIAGNOSTICS[phase])
        ],
    )


@bp.post("/api/lesson")
@require_user
def lesson_attempt():
    data = payload()
    lesson = next((x for x in LESSONS if x["id"] == data.get("id")), None)
    choice = data.get("choice")
    if (
        not lesson
        or type(choice) is not int
        or choice not in range(len(lesson["choices"]))
    ):
        return error("Escolha uma resposta válida.")
    correct = choice == lesson["answer"]
    record("lesson", lesson["id"], lesson["id"], correct)
    xp = award("lesson:" + lesson["id"], 50) if correct else 0
    get_db().commit()
    return jsonify(correct=correct, xp=xp, feedback=lesson["feedback"])


@bp.post("/api/scenario")
@require_user
def scenario_attempt():
    data = payload()
    scenario = next((x for x in SCENARIOS if x["id"] == data.get("id")), None)
    choice, stage = data.get("choice"), data.get("stage", "first")
    if (
        not scenario
        or type(choice) is not int
        or choice not in range(3)
        or stage not in ("first", "followup")
    ):
        return error("Escolha uma decisão válida.")
    if (
        scenario.get("advanced")
        and not get_db()
        .execute(
            "SELECT 1 FROM awards WHERE user_id=? AND item='lesson:senhas'",
            (session["uid"],),
        )
        .fetchone()
    ):
        return error("Conclua a lição de senhas e MFA para liberar este cenário.", 403)
    pending = session.get("pending", {})
    if stage == "first":
        correct = choice == scenario["answer"]
        pending[scenario["id"]] = choice
        session["pending"] = pending
        feedback = scenario["feedback"][choice]
        next_step = {
            "question": scenario["branches"][choice],
            "choices": scenario["followup_choices"][choice],
        }
    else:
        if scenario["id"] not in pending:
            return error("Comece pela primeira decisão deste cenário.")
        branch = pending[scenario["id"]]
        correct = choice == scenario["followup_answers"][branch]
        feedback = scenario["followup_feedback"]
        next_step = (
            None
            if correct
            else {
                "question": scenario["branches"][branch],
                "choices": scenario["followup_choices"][branch],
            }
        )
        if correct:
            pending.pop(scenario["id"])
            session["pending"] = pending
    record("scenario", scenario["id"] + ":" + stage, scenario["topic"], correct)
    xp = (
        award(
            "scenario:" + scenario["id"] + ":" + stage, 80 if stage == "first" else 40
        )
        if correct
        else 0
    )
    get_db().commit()
    return jsonify(correct=correct, xp=xp, feedback=feedback, next_step=next_step)


@bp.post("/api/recommendation")
@require_user
def open_recommendation():
    lesson_id = payload().get("id")
    if not isinstance(lesson_id, str) or lesson_id not in [x["id"] for x in LESSONS]:
        return error("Lição inválida.")
    get_db().execute(
        "UPDATE recommendations SET used=1 WHERE user_id=? AND lesson=?",
        (session["uid"], lesson_id),
    )
    get_db().commit()
    return jsonify(ok=True)
