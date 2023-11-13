# Integration with OAuth2 providers

Fractal supports OAuth2 login using GitHub, Google or custom providers.

First, configure the server as described in [OAuth2 documentation of fractal-server](https://fractal-analytics-platform.github.io/fractal-server/internals/users/#oauth2).

Fractal-web callback has to be defined using the following path: `/auth/login/oauth2`.

Then, enable the desired provider on fractal-web using the `PUBLIC_OAUTH_PROVIDER` environment variable, for example:

```
PUBLIC_OAUTH_PROVIDER=github
```
