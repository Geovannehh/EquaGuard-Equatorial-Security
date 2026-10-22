import tempfile
import unittest
from pathlib import Path
from equaguard import create_app


class AppTestCase(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.app = create_app(
            {
                "TESTING": True,
                "SECRET_KEY": "test-only-secret",
                "DATABASE": str(Path(self.temp.name) / "test.db"),
            }
        )
        self.client = self.app.test_client()
        self.token = self.client.get("/api/bootstrap").json["csrf"]
        self.post("login", {"profile": "campo", "role": "learner"})

    def post(self, path, data):
        return self.client.post(
            "/api/" + path, json=data, headers={"X-CSRF-Token": self.token}
        )
