#!/bin/bash



echo -e "\
DEPLOYMENT_TYPE=testing
JWT_SECRET_KEY=secret
SQLITE_PATH=`pwd`/test.db
FRACTAL_TASKS_DIR=/tmp/FRACTAL_TASKS_DIR
FRACTAL_LOGGING_LEVEL=20
FRACTAL_LOCAL_CONFIG_FILE=`pwd`/config_local.json
FRACTAL_RUNNER_BACKEND=local
FRACTAL_RUNNER_WORKING_BASE_DIR=`pwd`/artifacts
FRACTAL_ADMIN_DEFAULT_EMAIL=admin@fractal.xy
FRACTAL_ADMIN_DEFAULT_PASSWORD=1234
JWT_EXPIRE_SECONDS=84600
" > .fractal_server.env



rm test.db
rm -r /tmp/FRACTAL_TASKS_DIR
rm -r artifacts

# Create an empty db
fractalctl set-db

# Start the server
fractalctl start --port 8000
