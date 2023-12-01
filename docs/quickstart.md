# Quickstart instructions

## Intall node

Versions 18 or 20 of Node.js are recommended (check your version with `node
-v`). Version 16 is known to work, but not recommended.

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
then optionally checkout to a specific version tag
```
git checkout v0.6.0
```
and finally install via
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


## Web client startup

Run the client application via
```bash
npm run dev -- --open
```

The application is now running at `http://localhost:5173`.

An alternative way to start fractal-web is
```
npm run build    # corresponding to `vite build`, which creates a `build` folder
ORIGIN=http://localhost:5173 PORT=5173 node build
```
note that the `node` command relies on some environment variables, and
especially on `ORIGIN`:
> HTTP doesn't give SvelteKit a reliable way to know the URL that is currently
> being requested. The simplest way to tell SvelteKit where the app is being
> served is to set the `ORIGIN` environment variable.
> (https://kit.svelte.dev/docs/adapter-node#environment-variables-origin-protocolheader-and-hostheader)
