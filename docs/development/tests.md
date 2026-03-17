# Testing

## Unit tests

Unit tests are performed via [vitest](https://vitest.dev), via the `test` script defined in `package.json`.

## End-to-end testing

E2E tests are done using [Playwright](https://playwright.dev/).

The first time, or at Playwright upgrades, the following command can be used to install Playwright browsers and system dependencies:

```bash
npx playwright install --with-deps
```

Tests configuration is defined in the file `playwright.config.js`.

Usually you would like to run the tests with your currently running instances of fractal-server and fractal-web. By default, if port 8000 and port 5173 are active, Playwright will use the servers that are already running. Otherwise, Playwright will execute the script `tests/start-test-server.sh` to start fractal-server and npm commands to build and start the frontend server. Notice that the `start-test-server.sh` is designed for the CI environment and is not intended for developers who want to run tests locally.

To execute all the tests run the following command:

```bash
npx playwright test
```

To tests using only one of the supported browsers use the `--project` flag. Usually the tests run faster on Chromium:

```bash
npx playwright test --project=chromium
```

Two tests requires a special setup and can be ignored with specific environment variables:

1. `pixi.setup.js`, requires pixi to be installed and configured; use `SKIP_PIXI_TEST=true` to skip this test;
2. `oauth2.spec.js`, requires the IdP container; use `SKIP_OAUTH_TEST=true` to skip this test;

To execute a single test use:

```bash
npx playwright test tests/path/to/test.spec.js --project=chromium
```

Notice that if the test depends on other tests, they will be executed too. Some tests are a basic dependency of all the other tests (like `auth.setup.ts`).

To execute the tests seeing the browser add the `--headed` flag or the `--debug` flag if you need to watch them step by step.

To print Svelte webserver log set the environment variable `DEBUG=pw:webserver`.

### Run the OAuth2 login test

OAuth2 test requires a running instance of `dexidp` test image and a fractal-server instance configured to use it.

Use the following command to start the test IdP container:

```sh
docker run -d --rm -p 5556:5556 ghcr.io/fractal-analytics-platform/oauth:0.1
```

Set the following configuration to `.fractal_server.env`:

```
OAUTH_CLIENT_NAME=dexidp
OAUTH_CLIENT_ID=client_test_web_id
OAUTH_CLIENT_SECRET=client_test_web_secret
OAUTH_REDIRECT_URL=http://localhost:5173/auth/login/oauth2/
OAUTH_OIDC_CONFIG_ENDPOINT=http://127.0.0.1:5556/dex/.well-known/openid-configuration
```

## Coverage

> Warning: code coverage results are not reliable at the moment

Coverage for the unit tests:

```
npx vitest --coverage
```

Warning: coverage takes some time, since we are using the option `{ all: true }`.

### Local `fractal-server` instance

The `lib/fractal-server` folder includes basic instructions to get a local
instance of `fractal-server` running.

### Remote `fractal-server` instance

One could also test a local `fractal-web` instance with a remote `fractal-server` one.
If SSH access is possible, then a command like
```
REMOTE_PORT=8010
LOCAL_PORT=8000
REMOTE_USER=...
REMOTE_HOST_IP=...

ssh $REMOTE_USER@$REMOTE_HOST_IP -L $LOCAL_PORT:127.0.0.1:$REMOTE_PORT -N
```
should work and forward the remote port `REMOTE_PORT` to the `LOCAL_PORT` on
localhost, so that `fractal-web` can use it from the local machine. Note that
the required details for the `ssh -L` command may be different in each specific
case, depending for instance on the `fractal-server` configuration (e.g the
`--bind` argument of `gunicorn`), or on whether an additional proxy is needed
to reach the remote host.
