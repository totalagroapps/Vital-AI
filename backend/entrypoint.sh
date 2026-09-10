#!/bin/sh
set -e

PORT="${PORT:-8000}"
echo "[entrypoint.sh] Starting Gunicorn on 0.0.0.0:$PORT with 60s timeout..."
exec gunicorn main:app --workers 2 --worker-class uvicorn.workers.UvicornWorker --bind "0.0.0.0:$PORT" --timeout 60
