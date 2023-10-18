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

## Coverage

Coverage for the unit tests:

```
npx vitest run --coverage.enabled --coverage.provider=istanbul --coverage.include=src --coverage.reporter=json --coverage.all
```

Warning: coverage takes some time using the option `--coverage.all`.

Coverage for the playwright tests is automatically collected when running `npx playwright test`.

To generate a merged html report:

```
mkdir coverage-all
cp coverage-playwright/* coverage-all
cp coverage-unit/* coverage-all
cp .nyc_output/*.json coverage-all
npx nyc report --report-dir ./coverage-html --temp-dir ./coverage-all --reporter=html --exclude-after-remap false
```

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

ssh $REMOTE_USER@$REMOTE_HOST_IP -L $LOCAL_PORT:$REMOTE_HOST_IP:$REMOTE_PORT -N
```
should work and forward the remote port `REMOTE_PORT` to the `LOCAL_PORT` on
localhost, so that `fractal-web` can use it from the local machine. Note that
the required details for the `ssh -L` command may be different in each specific
case, depending for instance on the `fractal-server` configuration (e.g the
`--bind` argument of `gunicorn`), or on whether an additional proxy is needed
to reach the remote host.
