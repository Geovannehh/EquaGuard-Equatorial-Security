import unittest
from tests.base import AppTestCase
from unittest.mock import patch
from equaguard.database import get_db as db
from equaguard.content.escape import ROOMS, FINAL


class EscapeTests(AppTestCase):
    def start(self):
        response = self.post(
            "escape/start", {"team": "Equipe Luz", "members": 3, "minutes": 20}
        )
        self.assertEqual(response.status_code, 200)
        return response.json["run"]

    def solve(self, run):
        for stage, room in enumerate(ROOMS):
            response = self.post(
                "escape/answer",
                dict(
                    run_id=run["id"],
                    stage=stage,
                    evidence=room["evidence_answer"],
                    choice=room["answer"],
                ),
            )
            self.assertEqual(response.status_code, 200)
            self.assertTrue(response.json["correct"])
            run = response.json["run"]
            self.assertEqual(len(run["fragments"]), stage + 1)
        return run

    def finish(self, run):
        return self.post(
            "escape/answer",
            dict(
                run_id=run["id"],
                stage=5,
                code="".join(r["fragment"] for r in ROOMS),
                choice=FINAL["answer"],
            ),
        )

    def test_complete_and_non_repeatable_award(self):
        run = self.solve(self.start())
        self.assertIn("final", run)
        victory = self.finish(run)
        self.assertEqual(victory.json["run"]["status"], "won")
        self.assertEqual(victory.json["xp"], 250)
        self.assertEqual(victory.json["run"]["stars"], 3)
        self.assertEqual(self.finish(run).status_code, 409)
        p = self.client.get("/api/progress").json
        self.assertTrue(
            next(b for b in p["badges"] if b["name"] == "Guardiões da Energia")[
                "earned"
            ]
        )
        new = self.start()
        self.assertNotEqual(new["id"], run["id"])
        self.assertEqual(self.finish(self.solve(new)).json["xp"], 0)
        self.assertEqual(self.client.get("/api/progress").json["xp"], 250)

    def test_solo_mission_can_be_completed(self):
        for members in (0, 7):
            response = self.post('escape/start', {'team': 'Solo', 'members': members, 'minutes': 20})
            self.assertEqual(response.status_code, 400)
        response = self.post('escape/start', {'team': 'Solo', 'members': 1, 'minutes': 20})
        self.assertEqual(response.status_code, 200)
        run = response.json['run']
        self.assertEqual(run['members'], 1)
        result = self.finish(self.solve(run))
        self.assertEqual(result.json['run']['status'], 'won')
        self.assertEqual(result.json['xp'], 250)

    def test_clock_penalties_hint_idempotence_and_expiry(self):
        with patch("equaguard.services.escape_room.now", return_value=2000000000):
            run = self.start()
            self.assertEqual(run["remaining"], 1200)
            repeated = self.start()
            self.assertEqual(repeated["id"], run["id"])
            args = dict(run_id=run["id"], stage=0)
            hint = self.post("escape/hint", args).json["run"]
            self.assertEqual(hint["remaining"], 1140)
            self.assertIsNotNone(hint["hint"])
            self.assertEqual(
                self.post("escape/hint", args).json["run"]["remaining"], 1140
            )
            wrong = self.post(
                "escape/answer",
                dict(**args, evidence=ROOMS[0]["evidence_answer"], choice=0),
            ).json
            self.assertFalse(wrong["correct"])
            self.assertEqual(wrong["run"]["remaining"], 1110)
            self.assertEqual(wrong["run"]["stage"], 0)
        with patch("equaguard.services.escape_room.now", return_value=2000000110):
            self.assertEqual(
                self.client.get("/api/escape").json["run"]["remaining"], 1000
            )
        with patch("equaguard.services.escape_room.now", return_value=2000001201):
            expired = self.client.get("/api/escape").json["run"]
            self.assertEqual(expired["status"], "expired")
            self.assertEqual(expired["remaining"], 0)
            self.assertEqual(
                self.post(
                    "escape/answer",
                    dict(**args, evidence=ROOMS[0]["evidence_answer"], choice=1),
                ).status_code,
                409,
            )
            self.assertEqual(self.client.get("/api/progress").json["xp"], 0)

    def test_validation_and_no_skip_or_answer_leak(self):
        self.assertEqual(self.app.test_client().get("/api/escape").status_code, 401)
        self.assertEqual(
            self.post(
                "escape/start", {"team": "a", "members": True, "minutes": 20}
            ).status_code,
            400,
        )
        run = self.start()
        self.assertNotIn("answer", run["room"])
        self.assertNotIn("evidence_answer", run["room"])
        self.assertNotIn("fragment", run["room"])
        self.assertEqual(run["fragments"], [])
        self.assertNotIn("final", run)
        args = dict(run_id=run["id"], stage=0)
        self.assertEqual(
            self.post(
                "escape/answer", dict(**args, evidence=["dominio"], choice=1)
            ).status_code,
            400,
        )
        self.assertEqual(
            self.post(
                "escape/answer",
                dict(**args, evidence=["dominio", "dominio", "urgencia"], choice=1),
            ).status_code,
            400,
        )
        self.assertEqual(
            self.post(
                "escape/answer",
                dict(**args, evidence=ROOMS[0]["evidence_answer"], choice=True),
            ).status_code,
            400,
        )
        self.assertEqual(
            self.post(
                "escape/answer", dict(run_id=run["id"], stage=5, code="74295", choice=2)
            ).status_code,
            409,
        )
        self.assertEqual(self.client.get("/api/escape").json["run"]["mistakes"], 0)
        self.post(
            "escape/answer",
            dict(**args, evidence=ROOMS[0]["evidence_answer"], choice=1),
        )
        self.assertEqual(
            self.post(
                "escape/answer",
                dict(**args, evidence=ROOMS[0]["evidence_answer"], choice=1),
            ).status_code,
            409,
        )
        self.assertEqual(self.client.get("/api/escape").json["run"]["stage"], 1)

    def test_profile_isolation_and_restore(self):
        run = self.start()
        self.post("login", {"profile": "atendimento", "role": "learner"})
        self.assertIsNone(self.client.get("/api/escape").json["run"])
        self.assertEqual(
            self.post("escape/hint", {"run_id": run["id"], "stage": 0}).status_code, 409
        )
        self.post("login", {"profile": "campo", "role": "learner"})
        self.assertEqual(self.client.get("/api/escape").json["run"]["id"], run["id"])

    def test_wrong_final_and_hint_can_exhaust_clock(self):
        run = self.solve(self.start())
        wrong = self.post(
            "escape/answer", dict(run_id=run["id"], stage=5, code="00000", choice=2)
        ).json
        self.assertFalse(wrong["correct"])
        self.assertEqual(wrong["run"]["status"], "active")
        self.assertEqual(self.client.get("/api/progress").json["xp"], 0)
        self.assertEqual(self.finish(run).json["run"]["stars"], 2)
        run = self.start()
        with self.app.app_context():
            db().execute("UPDATE escape_runs SET deadline=20 WHERE id=?", (run["id"],))
            db().commit()
        with patch("equaguard.services.escape_room.now", return_value=10):
            hint = self.post("escape/hint", {"run_id": run["id"], "stage": 0}).json[
                "run"
            ]
            self.assertEqual(hint["status"], "expired")
