# Environment variables

The following environment variables can be used to configure fractal-web. 

> Only when using `npm run dev` or `npm run preview` these variables are automatically read from `.env.development` and `.env` files. In production they must be set in the shell that starts the node process.

* `FRACTAL_SERVER_HOST`: represents the URL of the fractal-server application (e.g. http://localhost:8000); this variable is **required**;
* `AUTH_COOKIE_NAME`: the name of the cookie used to store the user session; the default value is `fastapiusersauth`;
* `AUTH_COOKIE_DOMAIN`: specifies which server can receive the cookie; **remember to set it in production**;
* `AUTH_COOKIE_PATH`: the URL path where the cookie will be available; the default value is `/`;
* `AUTH_COOKIE_SECURE`: sends the cookie only if the server is using HTTPS; the default value is `true`, can be set to `false` during development;
* `AUTH_COOKIE_SAME_SITE`: set the [SameSite](https://web.dev/articles/samesite-cookies-explained) attribute to the cookie; the default value is `lax`;
* `PUBLIC_FRACTAL_ADMIN_SUPPORT_EMAIL`: the e-mail address displayed in the home page which can be used to send support requests; if the value is not set nothing is shown;
* `PUBLIC_UPDATE_JOBS_INTERVAL`: the delay in milliseconds which occurs between two background requests that check for job status updates; the default value is `3000`;
* `PUBLIC_OAUTH_CLIENT_NAME`: if set, the application enables the external account login via OAuth2; the name is used to create the authorization call sent to fractal-server;
* `LOG_FILE`: the path of the file where logs will be written; by default is unset and no file will be created;
* `LOG_LEVEL_FILE`: the log level of logs that will be written to the file; the default value is `info`;
* `LOG_LEVEL_CONSOLE`: the log level of logs that will be written to the console; the default value is `warn`;
