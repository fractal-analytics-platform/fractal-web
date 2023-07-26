
Notes:
* `DOMAIN=my.domain.ch` (for instance)
* `FRACTAL_SERVER_PORT=8000` (for instance) is the fractal-server port
* `FRACTAL_WEB_PORT=5175` (for instance) is the fractal-web port (exposed via apache)

1. `.env` file (replace as appropriate):
```bash
FRACTAL_SERVER_HOST=http://$DOMAIN:$FRACTAL_SERVER_PORT
# AUTH COOKIE
AUTH_COOKIE_NAME=fastapiusersauth
AUTH_COOKIE_SECURE=false
AUTH_COOKIE_DOMAIN=$DOMAIN
AUTH_COOKIE_PATH=/
AUTH_COOKIE_MAX_AGE=1800
AUTH_COOKIE_SAME_SITE=lax
AUTH_COOKIE_HTTP_ONLY=true
```

2. Build via
```bash
npm run build
```

3. Run via
```
PROTOCOL_HEADER=x-forwarded-proto HOST_HEADER=x-forwarded-host ORIGIN=https://$DOMAIN PORT=$FRACTAL_WEB_PORT node build
