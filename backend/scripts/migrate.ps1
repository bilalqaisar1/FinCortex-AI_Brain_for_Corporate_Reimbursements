$ErrorActionPreference = "Stop"

Set-Location (Split-Path -Parent $MyInvocation.MyCommand.Path) | Out-Null
Set-Location ..\ | Out-Null

pip install -r requirements.txt

if (-Not (Test-Path .\app\migrations\alembic.ini)) {
  # Initialize alembic structure if missing (keeps models and env.py)
  alembic init app\migrations | Out-Null
}

param(
  [string]$message = "auto"
)

alembic revision --autogenerate -m $message
alembic upgrade head

