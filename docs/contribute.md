# How to contribute to fractal-web

## Dev environment

Versions 16 and 18 of Node.js are supported (check your version with `node -v`).

If these versions are not available via your favorite package installer, you
can install them from [this link](https://nodejs.org/en/download) for your
specific platform. Another option is to use
[nvm](https://github.com/nvm-sh/nvm), e.g. via

```bash
nvm install 18
nvm alias default 18
```

## Install fractal-web

Clone this repository
```bash
git clone https://github.com/fractal-analytics-platform/fractal-web.git
cd fractal-web
```
and then install via
```bash
npm install
```

## Set environment variables

Environment variables are set either in `.env` or `.env.development` files, see
[vite documentation](https://vitejs.dev/guide/env-and-mode.html#env-files)
(briefly: `.env.development` is the relevant file when using `npm run dev`).

Here is an example of a `.env` file:
```bash
FRACTAL_SERVER_HOST=http://localhost:8000

# AUTH COOKIE
AUTH_COOKIE_NAME=fastapiusersauth
AUTH_COOKIE_SECURE=false
AUTH_COOKIE_DOMAIN=localhost
AUTH_COOKIE_PATH=/
AUTH_COOKIE_MAX_AGE=1800
AUTH_COOKIE_SAME_SITE=lax
AUTH_COOKIE_HTTP_ONLY=true

# PUBLIC VARIABLES (accessible from client side)
PUBLIC_FRACTAL_ADMIN_SUPPORT_EMAIL=help@localhost
```

Some relevant environment variables are:
* 

## Web client startup

The project comes with a default `.env.development` development environment file.
In this file are present a set of default values for the environment variables that are used by the application.
The default values are set to work with a local instance of a `fractal-server`.

Specifically, a fractal server is expected to run on `http://localhost:8000` as stated by the `FRACTAL_SERVER_HOST` variable.

If you want to run the application with a different fractal server instance, you can create a `.env.development.local` file
and override, for instance, the `FRACTAL_SERVER_HOST` variable with the address of your server instance, e.g.

```
FRACTAL_SERVER_HOST=http://localhost:8888
```

Run the client application via

```bash
npm run dev -- --open
```

The application is now running at `http://localhost:5173`.

An alternative way to start fractal-web is
```
npm run build    # corresponding to `vite build`, which creates a `build` folder
node build
```
note that the `node` command can include additional options, as described in https://kit.svelte.dev/docs/adapter-node#environment-variables.


## How to run static code analysis

TBD

## how to run vitest tests

TBD


## pre-commit setup

In your local folder, create a file `.git/hooks/pre-commit` with the following content

```bash
#!/bin/bash
npm run pre-commit
RESULT=$?
[ $RESULT -ne 0 ] && exit 1
exit 0
```

and make this file executable (`chmod +x .git/hooks/pre-commit`).

In this way, `npm run pre-commit` will run before every commit. This script is
defined in `package.json`, and points to
[`lint-staged`](https://github.com/okonet/lint-staged). The configuration is
written in `.lintstagedrc.json`, and it lists the checks to perform on each
kind of file (e.g. `eslint` and then `prettier`).
