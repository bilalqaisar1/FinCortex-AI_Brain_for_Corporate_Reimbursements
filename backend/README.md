# FinCortex Backend (Windows)

## Quick start (PowerShell)

```bash
cd backend
./scripts/start-dev.ps1
```

This will:
- create `.env` from `env_template.txt` if missing
- install deps from `requirements*.txt`
- run FastAPI with reload on `http://localhost:8000`

## Migrations

```bash
cd backend
./scripts/migrate.ps1 -message "init"
```

## Health check

Open `http://localhost:8000/api/v1/health`.
