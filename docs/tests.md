# Testing

## Unit tests

Unit tests are performed via [vitest](https://vitest.dev), via the `test` script defined in `package.json`. Current tests are in the `__tests__` folder.


## End-to-end testing

This is not yet implemented in an automated way (tracked in
https://github.com/fractal-analytics-platform/fractal-web/issues/8), and for
the moment it needs to be done manually.

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
