$ErrorActionPreference = "Stop"

Set-Location (Split-Path -Parent $MyInvocation.MyCommand.Path) | Out-Null
Set-Location ..\ | Out-Null

if (Test-Path .env) {
  Write-Host "Using .env"
} else {
  Copy-Item env_template.txt .env
  Write-Host "Created .env from template"
}

python -m pip install --upgrade pip
pip install -r requirements.txt

uvicorn app.main:app --host 0.0.0.0 --port 8000

