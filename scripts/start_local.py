"""Inicia o servidor e abre a página somente depois de confirmar a resposta."""
import os
from pathlib import Path
import socket
import subprocess
import sys
import time
import urllib.request
import webbrowser

ROOT = Path(__file__).resolve().parents[1]


def available_port(preferred):
    for port in range(preferred, min(preferred + 20, 65536)):
        with socket.socket() as probe:
            try:
                probe.bind(("127.0.0.1", port))
            except OSError:
                continue
            return port
    raise RuntimeError("Nenhuma porta local disponivel para iniciar o EquaGuard.")


def main():
    preferred = int((os.environ.get("PORT") or "3000"))
    if not 1024 <= preferred <= 65535:
        raise ValueError("PORT deve estar entre 1024 e 65535.")
    port = available_port(preferred)
    address = f"http://127.0.0.1:{port}"
    environment = dict(os.environ, PORT=str(port))
    process = subprocess.Popen([sys.executable, str(ROOT / "flask_app.py")], cwd=ROOT, env=environment)
    # Ignora proxies do sistema para a verificacao estritamente local.
    opener = urllib.request.build_opener(urllib.request.ProxyHandler({}))
    try:
        for _ in range(100):
            if process.poll() is not None:
                raise RuntimeError("O servidor encerrou antes de iniciar. Confira o erro acima.")
            try:
                with opener.open(address + "/health", timeout=0.5) as response:
                    ready = response.status == 200
            except OSError:
                ready = False
            if ready:
                print(f"EquaGuard: {address}/#inicio", flush=True)
                print("Mantenha esta janela aberta. Ctrl+C para encerrar.", flush=True)
                webbrowser.open(address + "/#inicio")
                return process.wait()
            time.sleep(0.2)
        raise RuntimeError("O servidor demorou para responder. Tente iniciar novamente.")
    except KeyboardInterrupt:
        return 0
    finally:
        if process.poll() is None:
            process.terminate()
            try:
                process.wait(timeout=5)
            except subprocess.TimeoutExpired:
                process.kill()
                process.wait()


if __name__ == "__main__":
    try:
        sys.exit(main())
    except (RuntimeError, ValueError) as error:
        print(f"Falha ao iniciar: {error}", file=sys.stderr)
        sys.exit(1)
