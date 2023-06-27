
`.fractal_server.env` file
```bash
DEPLOYMENT_TYPE=testing
JWT_SECRET_KEY=XXX
JWT_EXPIRE_SECONDS=80000
DB_ENGINE=postgres
POSTGRES_USER=XXX
POSTGRES_HOST=XXX
POSTGRES_DB=XXX
FRACTAL_TASKS_DIR=/some/folder
FRACTAL_LOGGING_LEVEL=20
FRACTAL_RUNNER_BACKEND=slurm
FRACTAL_RUNNER_WORKING_BASE_DIR=/some/other/folder
FRACTAL_SLURM_CONFIG_FILE=/some/file.json
FRACTAL_ADMIN_DEFAULT_EMAIL=XXX
FRACTAL_ADMIN_DEFAULT_PASSWORD=XXX
```

Startup command:
```bash
gunicorn fractal_server.main:app --workers 8 --worker-class uvicorn.workers.UvicornWorker --bind $DOMAIN:$FRACTAL_SERVER_PORT --access-logfile server_logs/fractal-server.out --error-logfile server_logs/fractal-server.err
```
where for instance `DOMAIN=my.domain.ch` and `FRACTAL_SERVER_PORT=8000`.

Alternative startup command:
```bash
fractalctl start --host $DOMAIN --port $FRACTAL_SERVER_PORT
```

