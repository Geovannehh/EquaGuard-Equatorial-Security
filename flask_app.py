"""Entrada local e compatibilidade com servidores WSGI."""

import os
from equaguard import create_app

app = create_app()

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.getenv("PORT") or "3000"), debug=False)
