import unittest
from tests.base import AppTestCase
from equaguard.content.learning import LESSONS, SCENARIOS


class EquaGuardTests(AppTestCase):
    def test_guards_and_validation(self):
        self.assertEqual(self.app.test_client().get("/api/progress").status_code, 401)
        self.assertEqual(self.client.post("/api/lesson", json={}).status_code, 403)
        self.assertEqual(self.client.get("/api/analytics").status_code, 403)
        self.assertEqual(
            self.post("lesson", {"id": "phishing", "choice": True}).status_code, 400
        )
        self.assertEqual(
            self.post("assessment", {"phase": "pre", "answers": [0]}).status_code, 400
        )
        self.assertEqual(
            self.post("login", {"profile": [], "role": "learner"}).status_code, 400
        )
        self.assertEqual(
            self.post(
                "scenario", {"id": "email", "stage": "followup", "choice": 0}
            ).status_code,
            400,
        )
        self.assertEqual(
            self.post("scenario", {"id": "suporte", "choice": 1}).status_code, 403
        )
        self.assertEqual(
            self.post(
                "assessment", {"phase": "post", "answers": [1, 0, 2]}
            ).status_code,
            400,
        )

    def test_learning_journey_persistence_and_xp(self):
        self.assertEqual(
            self.post("assessment", {"phase": "pre", "answers": [1, 0, 0]}).json["xp"],
            30,
        )
        self.assertEqual(
            self.post("assessment", {"phase": "pre", "answers": [0, 1, 2]}).status_code,
            400,
        )
        wrong = self.post("scenario", {"id": "email", "choice": 0}).json
        self.assertFalse(wrong["correct"])
        self.assertIn("senha", wrong["next_step"]["question"])
        self.assertEqual(
            self.post(
                "scenario", {"id": "email", "stage": "followup", "choice": 0}
            ).json["xp"],
            40,
        )
        for lesson in LESSONS:
            data = {"id": lesson["id"], "choice": lesson["answer"]}
            self.assertEqual(self.post("lesson", data).json["xp"], 50)
            self.assertEqual(self.post("lesson", data).json["xp"], 0)
        for scenario in SCENARIOS:
            first = self.post(
                "scenario", {"id": scenario["id"], "choice": scenario["answer"]}
            ).json
            self.assertTrue(first["correct"])
            correct = scenario["followup_answers"][scenario["answer"]]
            self.post(
                "scenario",
                {"id": scenario["id"], "stage": "followup", "choice": correct},
            )
        self.assertEqual(
            self.post("assessment", {"phase": "post", "answers": [1, 0, 2]}).json["xp"],
            60,
        )
        self.assertEqual(
            self.post("assessment", {"phase": "post", "answers": [1, 0, 2]}).json["xp"],
            0,
        )
        p = self.client.get("/api/progress").json
        self.assertEqual(p["xp"], 820)
        self.assertEqual(len(p["scenarios"]), 4)
        self.assertTrue(
            all(b["earned"] for b in p["badges"] if b["name"] != "Guardiões da Energia")
        )
        self.post("logout", {})
        self.post("login", {"profile": "campo", "role": "learner"})
        self.assertEqual(self.client.get("/api/progress").json["xp"], 820)
        self.post("login", {"profile": "atendimento", "role": "learner"})
        self.assertEqual(self.client.get("/api/progress").json["xp"], 0)

    def test_recommendations_and_analytics(self):
        for _ in range(2):
            self.post("scenario", {"id": "email", "choice": 0})
        p = self.client.get("/api/progress").json
        self.assertEqual(p["recommendations"][0]["lesson"], "phishing")
        self.assertEqual(p["recommendations"][0]["priority"], 2)
        self.post("recommendation", {"id": "phishing"})
        self.assertEqual(
            self.post("guardia", {"question": "Recebi um código MFA"}).json["lesson"],
            "senhas",
        )
        self.assertIsNone(
            self.post("guardia", {"question": "Qual o clima?"}).json["lesson"]
        )
        self.post("login", {"profile": "campo", "role": "manager"})
        overview = self.client.get("/api/analytics")
        self.assertEqual(overview.status_code, 200)
        self.assertNotIn("name", overview.json)
        self.assertGreaterEqual(overview.json["attempts"], 2)
        self.assertGreaterEqual(overview.json["recommendations"]["used"], 1)

    def test_pages_and_no_answer_leak(self):
        self.assertEqual(self.client.get("/").status_code, 200)
        self.assertEqual(self.client.get("/health").json["service"], "equaguard")
        bootstrap = self.client.get("/api/bootstrap").json
        self.assertNotIn("answer", bootstrap["lessons"][0])
        self.assertNotIn("followup_answers", bootstrap["scenarios"][0])
        with self.client.get("/static/js/app.js") as response:
            self.assertEqual(response.status_code, 200)
