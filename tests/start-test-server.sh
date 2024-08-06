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

  if [ "$SKIP_OAUTH_TEST" != "true" ]; then
    echo "\nOAUTH_DEXIDP_CLIENT_ID=client_test_web_id" >> "${fractal_server_test_path}/.fractal_server.env"
    echo "OAUTH_DEXIDP_CLIENT_SECRET=client_test_web_secret" >> "${fractal_server_test_path}/.fractal_server.env"
    echo "OAUTH_DEXIDP_REDIRECT_URL=http://localhost:5173/auth/login/oauth2/" >> "${fractal_server_test_path}/.fractal_server.env"
    echo "OAUTH_DEXIDP_OIDC_CONFIGURATION_ENDPOINT=http://127.0.0.1:5556/dex/.well-known/openid-configuration" >> "${fractal_server_test_path}/.fractal_server.env"
  fi

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
fractalctl start --port 8001
