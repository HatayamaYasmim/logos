
#!/usr/bin/env bash
set -e

echo "Aplicando migrations..."
alembic upgrade head

if [ "${DEMO_SEED_ENABLED:-false}" = "true" ]; then
    echo "Carregando dados demonstrativos..."
    python -m scripts.seed_demo
fi

echo "Iniciando Logos API..."
exec uvicorn app.main:app --host 0.0.0.0 --port "${PORT:-8000}"
