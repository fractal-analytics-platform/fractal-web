# Environment variables

The following environment variables can be used to configure fractal-web. 

> Only when using `npm run dev` or `npm run preview` these variables are automatically read from `.env.development` and `.env` files. In production they must be set in the shell that starts the node process.

* `FRACTAL_SERVER_HOST`: represents the URL of the fractal-server application (e.g. http://localhost:8000, or http://subdomain.example.org:8000); this variable is **required**;
* `AUTH_COOKIE_NAME`: the name of the cookie used to store the user session; the default value is `fastapiusersauth`;
* `AUTH_COOKIE_DOMAIN`: specifies which server can receive the cookie; **remember to set it in production**;
* `AUTH_COOKIE_PATH`: the URL path where the cookie will be available; the default value is `/`;
* `AUTH_COOKIE_SECURE`: sends the cookie only if the server is using HTTPS; the default value is `true`, can be set to `false` during development;
* `AUTH_COOKIE_SAME_SITE`: set the [SameSite](https://web.dev/articles/samesite-cookies-explained) attribute to the cookie; the default value is `lax`;
* `PUBLIC_FRACTAL_ADMIN_SUPPORT_EMAIL`: the e-mail address displayed in the home page which can be used to send support requests; if the value is not set nothing is shown;
* `PUBLIC_UPDATE_JOBS_INTERVAL`: the delay in milliseconds which occurs between two background requests that check for job status updates; the default value is `3000`;
* `PUBLIC_OAUTH_CLIENT_NAME`: if set, the application enables the external account login via OAuth2; the name is used to create the authorization call sent to fractal-server (see [configuration page](../oauth2/));
* `LOG_FILE`: the path of the file where logs will be written; by default is unset and no file will be created;
* `LOG_LEVEL_FILE`: the log level of logs that will be written to the file; the default value is `info`;
* `LOG_LEVEL_CONSOLE`: the log level of logs that will be written to the console; the default value is `warn`;
* `FRACTAL_RUNNER_BACKEND`: specifies which runner backend is used; supported values are: `local`, `slurm`, `slurm_ssh`; setting this variable is mandatory;
* `PUBLIC_FRACTAL_VIZARR_VIEWER_URL`: URL to [fractal-vizarr-viewer](https://github.com/fractal-analytics-platform/fractal-vizarr-viewer) service (e.g. http://localhost:3000/vizarr for testing);
* `WARNING_BANNER_PATH`: specifies the path to a text file containing the warning banner message displayed on the site; the banner is used to inform users about important issues, such as external resources downtime or maintenance alerts; if the variable is empty or unset no banner is displayed;
* `ENABLE_INTERACTIVE_ATTRIBUTE_FILTERS`: enable attribute filters interactive editing from the job-submission modal; supported values are `true` or `false`; default value is `false`.

When running directly using `node` command these extra variables can also be configured:

* `PORT`: specifies the port where Svelte server will run; the default value is 5173;
* `ORIGIN` the URL where the app will be served (e.g. http://localhost:5173, or https://subdomain.example.org);
* `BODY_SIZE_LIMIT`: the maximum request body size accepted in bytes; see [official SvelteKit documentation](https://svelte.dev/docs/kit/adapter-node#Environment-variables-BODY_SIZE_LIMIT).

## Common issues related to environment variables

The `node` command relies on some extra environment variables, and especially on `ORIGIN`:

> HTTP doesn't give SvelteKit a reliable way to know the URL that is currently
> being requested. The simplest way to tell SvelteKit where the app is being
> served is to set the `ORIGIN` environment variable 
> (see [SvelteKit node servers documentation](https://kit.svelte.dev/docs/adapter-node#environment-variables-origin-protocolheader-hostheader-and-port-header)).
> A wrong origin value will result in the error message "Cross-site POST form submissions are forbidden".

Unexpected behaviors can be related to wrong values of the `AUTH_COOKIE_DOMAIN` variable:

> A typical gotcha: if there is a mismatch between the cookie domain and the
> URL you are using (e.g. one points to localhost and the other one to
> 127.0.0.1), then the cookie won't be set and this will fail silently,
> therefore likely triggering other unexpected behaviors.
> If you leave the `AUTH_COOKIE_DOMAIN` empty, the cookie domain will be
> inferred from the HTTP call. This is useful to avoid domain mismatch issues
> during testing and development, but in production is suggested to set it as
> the name of the domain where the fractal-web server is running.
