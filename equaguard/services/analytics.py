"""Indicadores agregados, sem exposição de perfis individuais."""

from ..database import get_db
from ..content.learning import LESSONS


def get_analytics():
    connection = get_db()
    users = connection.execute("SELECT COUNT(*) FROM learners").fetchone()[0]
    lessons = connection.execute(
        "SELECT COUNT(*) FROM awards WHERE item LIKE 'lesson:%'"
    ).fetchone()[0]
    totals = connection.execute(
        "SELECT COUNT(*) n,COALESCE(SUM(correct),0) correct FROM attempts WHERE kind='scenario'"
    ).fetchone()
    report = connection.execute(
        "SELECT COUNT(*) n,COALESCE(SUM(correct),0) correct FROM attempts WHERE kind='scenario' AND item='email:first'"
    ).fetchone()
    competence = [
        dict(row)
        for row in connection.execute(
            "SELECT topic,COUNT(*) attempts,SUM(correct) correct FROM attempts GROUP BY topic"
        )
    ]
    pairs = connection.execute(
        "SELECT a.score pre,(SELECT b.score FROM assessments b WHERE b.user_id=a.user_id AND b.phase='post' ORDER BY b.id DESC LIMIT 1) post FROM assessments a WHERE a.phase='pre'"
    ).fetchall()
    pairs = [p for p in pairs if p["post"] is not None]
    rec = connection.execute(
        "SELECT COUNT(*) offered,COALESCE(SUM(used),0) used FROM recommendations"
    ).fetchone()
    return dict(
        users=users,
        completed_lessons=lessons,
        completion=round(lessons / (users * len(LESSONS)) * 100) if users else 0,
        recognition=(
            round(totals["correct"] / totals["n"] * 100) if totals["n"] else None
        ),
        attempts=totals["n"],
        report_rate=(
            round(report["correct"] / report["n"] * 100) if report["n"] else None
        ),
        report_attempts=report["n"],
        evolution=(
            round(sum((p["post"] - p["pre"]) / 3 * 100 for p in pairs) / len(pairs))
            if pairs
            else None
        ),
        paired_users=len(pairs),
        competence=competence,
        recommendations=dict(rec),
    )
