
Note: `X.X.X.X` is the IP address of the machine where fractal-server and fractal-web are running. 5174 is the port used for fractal-web.

---

Env file (`.env`):
```bash
FRACTAL_SERVER_HOST=http://X.X.X.X:8000

# AUTH COOKIE
AUTH_COOKIE_NAME=fastapiusersauth
AUTH_COOKIE_SECURE=false
AUTH_COOKIE_DOMAIN=X.X.X.X
AUTH_COOKIE_PATH=/
AUTH_COOKIE_MAX_AGE=1800
AUTH_COOKIE_SAME_SITE=lax
AUTH_COOKIE_HTTP_ONLY=true
```

See [fastapi-users cookie configuration](https://fastapi-users.github.io/fastapi-users/11.0/configuration/authentication/transports/cookie/?h=cookie).


**After** setting the `.env` file, we run
```
npm run build
```
which corresponds to `vite build`.

**After** building, we start the `node` server on the `build` folder:
```
PROTOCOL_HEADER=x-forwarded-proto HOST_HEADER=x-forwarded-host PORT=5174 ORIGIN=http://XXXX node build
```
See [SvelteKit node-server configuration](https://kit.svelte.dev/docs/adapter-node#environment-variables).

This prints a first log line that looks like
```
Listening on 0.0.0.0:5174
```
