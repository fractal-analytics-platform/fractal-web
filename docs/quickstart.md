# Quickstart instructions

> This page describes how to install fractal-web from release packages. If you need to install it from the git repository see the [development setup page](./development/setup.md).

## Install node

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

## Install fractal-web from release packages

Starting from version 1.1.0, fractal-web releases provide tar.gz files containing the built files for each supported node version. You can install these packages with the following command:

```
FRACTAL_WEB_VERSION=1.1.0 && NODE_MAJOR_VERSION=20 && wget -qO- "https://github.com/fractal-analytics-platform/fractal-web/releases/download/v${FRACTAL_WEB_VERSION}/node-${NODE_MAJOR_VERSION}-fractal-web-v${FRACTAL_WEB_VERSION}.tar.gz" | tar -xz
```

**Note**: this will unpack in the current working directory the file `package.json` and the folders `build` and `node_modules`.

To start the application installed in this way see the section "Run fractal-web from the build folder".

## Set environment variables

To properly run fractal-web you have to configure some environment variables. The [environment variables page](./environment-variables.md) contains the complete list of supported environment variables and their default values. It also includes some troubleshooting infomation about errors related to environment variables misconfiguration.

If you want to run the application executing `node` in the `build` folder you have to export the environment variables in your shell. The following section provides an example on how to do that with a script.

## Run fractal-web from the build folder

You can create a script with the following content to run fractal-web installed from a release package:

```bash
#!/bin/sh

export FRACTAL_SERVER_HOST=http://localhost:8000
export PUBLIC_FRACTAL_ADMIN_SUPPORT_EMAIL=help@localhost
export PUBLIC_OAUTH_CLIENT_NAME=
# remember to set this in production
export AUTH_COOKIE_DOMAIN=
# set this to true in production
export AUTH_COOKIE_SECURE=false

export ORIGIN=http://localhost:5173
export PORT=5173

export LOG_FILE=fractal-web.log
export LOG_LEVEL_FILE=info
export LOG_LEVEL_CONSOLE=warn

# default values are usually fine for the following variables; remove comments if needed
#export AUTH_COOKIE_NAME=fastapiusersauth
#export AUTH_COOKIE_PATH=/
#export AUTH_COOKIE_SAME_SITE=lax
#export PUBLIC_UPDATE_JOBS_INTERVAL=3000

node build/
```

**Note**: starting from Node 20 you can also load the environment variables from a file using the `--env-file` flag:

```bash
node --env-file=.env build
```
