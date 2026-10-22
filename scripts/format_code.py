"""Formata o código ativo; requer requirements-dev.txt."""

from pathlib import Path

import black
import cssbeautifier
import jsbeautifier

ROOT = Path(__file__).resolve().parent.parent


def main():
    options = jsbeautifier.default_options()
    options.indent_size = 4
    options.end_with_newline = True
    options.wrap_line_length = 100
    python_files = [ROOT / "flask_app.py", ROOT / "pythonanywhere_wsgi.py"]
    for folder in ("equaguard", "tests", "scripts"):
        python_files.extend((ROOT / folder).rglob("*.py"))
    for filename in python_files:
        try:
            result = black.format_file_contents(
                filename.read_text(encoding="utf-8"),
                fast=False,
                mode=black.Mode(line_length=88),
            )
        except black.NothingChanged:
            continue
        filename.write_text(result, encoding="utf-8")
    for filename in (ROOT / "equaguard/static/js").rglob("*.js"):
        result = jsbeautifier.beautify(filename.read_text(encoding="utf-8"), options)
        filename.write_text(result, encoding="utf-8")
    for filename in (ROOT / "equaguard/static/css").rglob("*.css"):
        result = cssbeautifier.beautify(filename.read_text(encoding="utf-8"), options)
        filename.write_text(result + "\n", encoding="utf-8")


if __name__ == "__main__":
    main()
