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

By default v2 tests are run. These tests require running a fractal-server instance using `FRACTAL_RUNNER_BACKEND=local_experimental`.

To run v1 tests start playwright setting the environment variable `TEST_VERSION` to `v1`. These tests require running a fractal-server instance using `FRACTAL_RUNNER_BACKEND=local`.

OAuth2 test requires a running instance of dexidp test image and a fractal-server instance configured to use it. To skip OAuth2 test set the environment variable `SKIP_OAUTH_TEST` to `true`.

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
