"""Configuração opcional para o diretório original no PythonAnywhere."""

import os
import sys

project_path = os.path.expanduser("~/conecta-campus")
if project_path not in sys.path:
    sys.path.insert(0, project_path)
os.environ.setdefault("COOKIE_SECURE", "1")
from flask_app import app as application
