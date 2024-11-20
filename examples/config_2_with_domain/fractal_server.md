Notes:
* http://fractal.XXX.ch is the domain associated to the machine where fractal-server and fractal-web are running

---

Env file (`.fractal_server.env`):
```bash
DEPLOYMENT_TYPE=testing
JWT_SECRET_KEY=secret
FRACTAL_TASKS_DIR=tasks
FRACTAL_LOGGING_LEVEL=00
FRACTAL_RUNNER_BACKEND=local
FRACTAL_RUNNER_WORKING_BASE_DIR=artifacts
```

Set-up and start-up command:
```
fractalctl set-db

fractalctl start --host fractal.XXX.ch --port 8000
```

Logs include
```
fractal_server.app.db
INFO:     Started server process [32375]
INFO:     Waiting for application startup.
2023-06-13 08:23:13,736 - fractal_server.main - WARNING - User admin@fractal.xy already exists
INFO:     Application startup complete.
INFO:     Uvicorn running on http://fractal.XXX.ch:8000 (Press CTRL+C to quit)
```
