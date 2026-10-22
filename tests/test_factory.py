import tempfile
import unittest
from pathlib import Path

from equaguard import create_app
from equaguard.database import get_db
from tests.base import AppTestCase


class FactoryTests(AppTestCase):
    def test_factories_keep_data_isolated(self):
        with tempfile.TemporaryDirectory() as directory:
            other = create_app(
                {
                    "TESTING": True,
                    "SECRET_KEY": "test",
                    "DATABASE": str(Path(directory) / "other.db"),
                }
            )
            with other.app_context():
                self.assertEqual(
                    get_db().execute("SELECT COUNT(*) FROM learners").fetchone()[0], 0
                )
            with self.app.app_context():
                self.assertEqual(
                    get_db().execute("SELECT COUNT(*) FROM learners").fetchone()[0], 1
                )

    def test_recreating_app_preserves_existing_database(self):
        self.post("lesson", {"id": "phishing", "choice": 1})
        recreated = create_app(dict(self.app.config))
        with recreated.app_context():
            self.assertEqual(
                get_db().execute("SELECT SUM(xp) FROM awards").fetchone()[0], 50
            )
            self.assertEqual(
                get_db().execute("SELECT COUNT(*) FROM escape_runs").fetchone()[0], 0
            )

    def test_page_loads_module_entry_and_split_stylesheets(self):
        html = self.client.get("/").get_data(as_text=True)
        self.assertIn('type="module"', html)
        for filename in [
            "js/app.js",
            "js/core.js",
            "js/navigation.js",
            "css/base.css",
            "css/pages/home.css",
            "css/pages/escape.css",
        ]:
            response = self.client.get("/static/" + filename)
            self.assertEqual(response.status_code, 200, filename)
            response.close()
        self.assertNotIn("/static/js/escape.js", html)


if __name__ == "__main__":
    unittest.main()
