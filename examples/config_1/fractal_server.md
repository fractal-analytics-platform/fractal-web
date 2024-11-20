Note: `X.X.X.X` is the IP address of the machine where fractal-server and fractal-web are running. 8000 is the port used for fractal-server.

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
fractalctl start --host X.X.X.X
```

Logs include
```
INFO:     Started server process [32331]
INFO:     Waiting for application startup.
2023-05-18 07:55:41,742 - fractal_server.main - INFO - User admin@fractal.xy created
INFO:     Application startup complete.
INFO:     Uvicorn running on http://X.X.X.X:8000 (Press CTRL+C to quit)
```
