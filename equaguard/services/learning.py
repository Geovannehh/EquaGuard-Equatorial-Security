"""Progresso, recomendações e recompensas da jornada."""

from flask import session
from ..database import get_db
from ..content.learning import LESSONS, SCENARIOS


def award(item, xp):
    cur = get_db().execute(
        "INSERT OR IGNORE INTO awards VALUES(?,?,?)", (session["uid"], item, xp)
    )
    return xp if cur.rowcount else 0


def record(kind, item, topic, correct):
    get_db().execute(
        "INSERT INTO attempts(user_id,kind,item,topic,correct) VALUES(?,?,?,?,?)",
        (session["uid"], kind, item, topic, int(correct)),
    )


def recommendations():
    uid = session["uid"]
    results = []
    for lesson in LESSONS:
        failures = (
            get_db()
            .execute(
                "SELECT COUNT(*) FROM attempts WHERE user_id=? AND topic=? AND correct=0",
                (uid, lesson["id"]),
            )
            .fetchone()[0]
        )
        completed = (
            get_db()
            .execute(
                "SELECT 1 FROM awards WHERE user_id=? AND item=?",
                (uid, "lesson:" + lesson["id"]),
            )
            .fetchone()
        )
        if not completed:
            reason = (
                f"Você tem {failures} {'decisão' if failures == 1 else 'decisões'} para revisar neste tema. Pratique com esta lição."
                if failures
                else "Uma próxima etapa para ampliar sua proteção no dia a dia."
            )
            results.append(
                {
                    "lesson": lesson["id"],
                    "title": lesson["title"],
                    "reason": reason,
                    "priority": failures,
                }
            )
    results.sort(key=lambda item: -item["priority"])
    for item in results[:2]:
        get_db().execute(
            "INSERT OR IGNORE INTO recommendations(user_id,lesson) VALUES(?,?)",
            (uid, item["lesson"]),
        )
    get_db().commit()
    return results[:2]


def progress():
    uid = session["uid"]
    awards = {
        r["item"]: r["xp"]
        for r in get_db().execute("SELECT item,xp FROM awards WHERE user_id=?", (uid,))
    }
    assessments = [
        dict(r)
        for r in get_db().execute(
            "SELECT phase,score,created_at FROM assessments WHERE user_id=? ORDER BY id",
            (uid,),
        )
    ]
    attempts = [
        dict(r)
        for r in get_db().execute(
            "SELECT kind,item,topic,correct,created_at FROM attempts WHERE user_id=? ORDER BY id DESC LIMIT 12",
            (uid,),
        )
    ]
    totals = (
        get_db()
        .execute(
            "SELECT COUNT(*) n,COALESCE(SUM(correct),0) correct FROM attempts WHERE user_id=?",
            (uid,),
        )
        .fetchone()
    )
    xp = sum(awards.values())
    levels = [
        (0, "Explorador"),
        (150, "Sentinela"),
        (350, "Defensor"),
        (600, "Guardião"),
    ]
    level = max(i for i, (minimum, _) in enumerate(levels) if xp >= minimum)
    lessons = [x["id"] for x in LESSONS if "lesson:" + x["id"] in awards]
    scenarios = [
        x["id"] for x in SCENARIOS if "scenario:" + x["id"] + ":followup" in awards
    ]
    pre = next((a["score"] for a in assessments if a["phase"] == "pre"), None)
    post = next(
        (a["score"] for a in reversed(assessments) if a["phase"] == "post"), None
    )
    badges = [
        {
            "name": "Primeiro passo",
            "description": "Conclua o diagnóstico",
            "earned": pre is not None,
        },
        {
            "name": "Olhar atento",
            "description": "Reporte o e-mail suspeito",
            "earned": "scenario:email:first" in awards,
        },
        {
            "name": "Acesso protegido",
            "description": "Conclua a lição de senhas",
            "earned": "senhas" in lessons,
        },
        {
            "name": "Aprendiz constante",
            "description": "Conclua três lições",
            "earned": len(lessons) >= 3,
        },
        {
            "name": "Evolução real",
            "description": "Melhore seu resultado no pós-teste",
            "earned": pre is not None and post is not None and post > pre,
        },
        {
            "name": "Guardião digital",
            "description": "Conclua as cinco lições e três simulações principais",
            "earned": len(lessons) == 5
            and all(s in scenarios for s in ["email", "ordem", "qr"]),
        },
        {
            "name": "Guardiões da Energia",
            "description": "Conclua o escape room e impeça o ataque fictício",
            "earned": "escape:guardian" in awards,
        },
    ]
    return dict(
        xp=xp,
        level=level + 1,
        level_name=levels[level][1],
        level_start=levels[level][0],
        next_level=levels[level + 1][0] if level < 3 else None,
        lessons=lessons,
        scenarios=scenarios,
        pre=pre,
        post=post,
        badges=badges,
        attempts=attempts,
        accuracy=round(totals["correct"] / totals["n"] * 100) if totals["n"] else None,
        attempt_count=totals["n"],
        estimated_minutes=sum(x["minutes"] for x in LESSONS if x["id"] in lessons),
        recommendations=recommendations(),
    )
