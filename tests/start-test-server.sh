#!/bin/sh

# Exit on errors
set -e

# Check fractal-server version argument
if [ $# -ne 1 ]; then
  echo "Usage: $0 <fractal-server-version>"
  exit 2
fi

fractal_server_path="$(pwd)/lib/fractal-server"
fractal_server_test_path="/tmp/fractal-test-server"

if [ ! -d "$fractal_server_test_path" ]; then
  # Create test folder
  mkdir "$fractal_server_test_path"

  # Copy test configuration files
  cp "$(pwd)/lib/fractal-server/config_local.json" "$fractal_server_test_path"
  cp "$(pwd)/tests/.fractal_server.env" "$fractal_server_test_path"

  cd "$fractal_server_test_path"

  # Virtualenv, dependencies and db
  python3 -m venv myenv
  . myenv/bin/activate
  pip install "fractal-server==$1"
  pip install fractal-server[postgres-psycopg-binary]
  fractalctl set-db
else
  cd "$fractal_server_test_path"
  . myenv/bin/activate
fi

# Start
fractalctl start --port 8000
