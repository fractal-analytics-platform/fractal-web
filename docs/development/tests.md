# Testing

## Unit tests

Unit tests are performed via [vitest](https://vitest.dev), via the `test` script defined in `package.json`.

## End-to-end testing

E2E tests are done using playwright. They can be executed using the following command:

```
npx playwright test
```

To print Svelte webserver log set the environment variable `DEBUG=pw:webserver`.

To execute the tests seeing the browser add the `--headed` flag or the `--debug` flag if you need to watch them step by step.

OAuth2 test requires a running instance of dexidp test image and a fractal-server instance configured to use it.

To skip OAuth2 test set the environment variable `SKIP_OAUTH_TEST` to `true`.

To skip Pixi test set the environment variable `SKIP_PIXI_TEST` to `true`.

To run the OAuth2 test locally add the following configuration to `.fractal_server.env`:

```
OAUTH_DEXIDP_CLIENT_ID=client_test_web_id
OAUTH_DEXIDP_CLIENT_SECRET=client_test_web_secret
OAUTH_DEXIDP_REDIRECT_URL=http://localhost:5173/auth/login/oauth2/
OAUTH_DEXIDP_OIDC_CONFIGURATION_ENDPOINT=http://127.0.0.1:5556/dex/.well-known/openid-configuration
```

And then start the test IdP container:

```sh
docker run -d --rm -p 5556:5556 ghcr.io/fractal-analytics-platform/oauth:0.1
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
