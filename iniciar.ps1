$ErrorActionPreference = 'Stop'
Set-Location -LiteralPath $PSScriptRoot
$appPython = Join-Path $PSScriptRoot '.venv\Scripts\python.exe'
if (-not (Test-Path -LiteralPath $appPython)) {
    if (Get-Command py -ErrorAction SilentlyContinue) {
        & py -3 -m venv .venv
    } elseif (Get-Command python -ErrorAction SilentlyContinue) {
        & python -m venv .venv
    } else {
        Write-Host 'Instale o Python pelo site https://www.python.org/downloads/windows/ e abra este arquivo novamente.'
        Read-Host 'Pressione Enter para sair'
        exit 1
    }
    if ($LASTEXITCODE -ne 0) { throw 'Nao foi possivel criar o ambiente Python.' }
}
& $appPython -c "import importlib.util; raise SystemExit(0 if importlib.util.find_spec('flask') else 1)"
if ($LASTEXITCODE -ne 0) {
    & $appPython -m pip install -r requirements.txt
    if ($LASTEXITCODE -ne 0) { throw 'Falha ao instalar dependencias. Verifique a conexao e tente novamente.' }
}
& $appPython scripts/start_local.py
if ($LASTEXITCODE -ne 0) { throw 'Nao foi possivel iniciar o EquaGuard. Confira a mensagem acima.' }
