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
  cd "$fractal_server_test_path"

  # Copy test configuration files
  cp "$fractal_server_path/config_local.json" .
  cp "$fractal_server_path/.fractal_server.env" .

  # Virtualenv, dependencies and db
  python3 -m venv myenv
  . myenv/bin/activate
  pip install "fractal-server==$1"
  fractalctl set-db
fi

cd "$fractal_server_test_path"

# Start
fractalctl start --port 8000
