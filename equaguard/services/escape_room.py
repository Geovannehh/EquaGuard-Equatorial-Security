"""Estado público, prazo e concorrência das partidas."""

import json
import math
import time
from flask import jsonify, session
from ..database import get_db
from ..http import error
from ..content.escape import ROOMS, FINAL


def now():
    return time.time()


def latest():
    return (
        get_db()
        .execute(
            "SELECT * FROM escape_runs WHERE user_id=? ORDER BY started DESC, rowid DESC LIMIT 1",
            (session["uid"],),
        )
        .fetchone()
    )


def expire(run):
    if run and run["status"] == "active" and now() >= run["deadline"]:
        get_db().execute(
            "UPDATE escape_runs SET status='expired',finished=? WHERE id=?",
            (now(), run["id"]),
        )
        run = (
            get_db()
            .execute("SELECT * FROM escape_runs WHERE id=?", (run["id"],))
            .fetchone()
        )
    return run


def public(run):
    if not run:
        return None
    data = {
        k: run[k]
        for k in (
            "id",
            "team",
            "members",
            "duration",
            "stage",
            "status",
            "mistakes",
            "last_feedback",
            "xp",
        )
    }
    hints = json.loads(run["hints"])
    data.update(
        remaining=(
            max(0, math.ceil(run["deadline"] - now()))
            if run["status"] == "active"
            else max(0, math.ceil(run["deadline"] - (run["finished"] or now())))
        ),
        hint_count=len(hints),
        hint_used=run["stage"] in hints,
        fragments=[
            dict(number=i + 1, code=r["fragment"], seal=r["seal"], title=r["title"])
            for i, r in enumerate(ROOMS[: run["stage"]])
        ],
        rooms=[
            dict(number=i + 1, title=r["title"], zone=r["zone"], icon=r["icon"])
            for i, r in enumerate(ROOMS)
        ],
        stars=(
            max(1, 3 - int(run["mistakes"] > 0) - int(len(hints) > 0))
            if run["status"] == "won"
            else 0
        ),
    )
    if run["status"] == "active":
        if run["stage"] < len(ROOMS):
            room = ROOMS[run["stage"]]
            data["room"] = {
                k: v
                for k, v in room.items()
                if k
                not in (
                    "evidence_answer",
                    "answer",
                    "fragment",
                    "seal",
                    "learning",
                    "hint",
                )
            }
            data["room"]["selection_count"] = len(room["evidence_answer"])
            data["hint"] = room["hint"] if run["stage"] in hints else None
        else:
            data["final"] = {
                k: v for k, v in FINAL.items() if k not in ("answer", "learning")
            }
    if run["status"] != "active":
        data["debrief"] = [
            dict(title=r["title"], learning=r["learning"], solved=i < run["stage"])
            for i, r in enumerate(ROOMS)
        ]
        data["final_learning"] = FINAL["learning"]
    return data


def locked_run(data):
    get_db().execute("BEGIN IMMEDIATE")
    run = expire(latest())
    if not run or data.get("run_id") != run["id"]:
        get_db().commit()
        return None, error("Esta partida mudou. Atualize a missão para continuar.", 409)
    if run["status"] != "active":
        get_db().commit()
        return None, (jsonify(error="Esta partida já terminou.", run=public(run)), 409)
    if type(data.get("stage")) is not int or data["stage"] != run["stage"]:
        get_db().commit()
        return None, error(
            "A equipe já avançou. Atualize a missão para ver a sala atual.", 409
        )
    return run, None
