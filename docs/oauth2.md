# Integration with OAuth2 providers

Fractal supports OAuth2 login using GitHub, Google or custom providers.

First, configure the server as described in [OAuth2 documentation of fractal-server](https://fractal-analytics-platform.github.io/fractal-server/internals/users/#oauth2).

Fractal-web callback has to be defined using the following path: `/auth/login/oauth2`.

Then, enable the desired provider on fractal-web using the `PUBLIC_OAUTH_CLIENT_NAME` environment variable, for example:

```
PUBLIC_OAUTH_CLIENT_NAME=github
```

This variable has to match the client name defined in fractal-server configuration.


## Full details for local example

1. Register an OAuth2 app on GitHub with _Homepage URL_ http://127.0.0.1:5173 and _Authorization callback URL_ http://127.0.0.1:5173/auth/login/oauth2/.
2. Set up the following env variables for fractal-server:
```
OAUTH_GITHUB_CLIENT_ID=...
OAUTH_GITHUB_CLIENT_SECRET=...
OAUTH_GITHUB_REDIRECT_URL=http://127.0.0.1:5173/auth/login/oauth2/
# [all other variables]
```
3. Set up the following env variables for fractal-web:
```
FRACTAL_SERVER_HOST=http://127.0.0.1:8000
AUTH_COOKIE_DOMAIN=127.0.0.1
PUBLIC_OAUTH_CLIENT_NAME=github
# [all other variables]
```

> A typical gotcha: if there is a mismatch between the cookie domain and the
> URL you are using (e.g. one points to localhost and the other one to
> 127.0.0.1), then the cookie won't be set and this will fail silently,
> therefore likely triggering other unexpected behaviors.
