# Integration with OAuth2 providers

Fractal supports OAuth2 login using GitHub, Google or custom providers.

First, configure the server as described in [OAuth2 documentation of fractal-server](https://fractal-analytics-platform.github.io/fractal-server/internals/users/#oauth2).

Fractal-web callback has to be defined using the following path: `/auth/login/oauth2`.

Then, enable the desired provider on fractal-web using the `PUBLIC_OAUTH_CLIENT_NAME` environment variable, for example:

```
PUBLIC_OAUTH_CLIENT_NAME=github
```

This variable has to match the client name defined in fractal-server configuration.
