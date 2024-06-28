# Development setup

## Install node

Versions 18 or 20 of Node.js are recommended. See the [quickstart](../quickstart.md) for more details about how to install node.

## Install fractal-web from git repository

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
cd jschema
npm install
cd ..
npm install
```

## Set environment variables

To properly run fractal-web you have to configure some environment variables. The [environment variables page](../environment-variables.md) contains the complete list of supported environment variables and their default values. It also includes some troubleshooting infomation about errors related to environment variables misconfiguration.

When running the application from the git repository, environment variables are set either in `.env` or `.env.development` files, see
[vite documentation](https://vitejs.dev/guide/env-and-mode.html#env-files)
(briefly: `.env.development` is the relevant file when using `npm run dev` and `.env` is the relevant file when using `npm run preview`).

You can also add your customizations in a file named `.env.local` or `.env.development.local` to avoid writing on env files that are under version control.

## Run fractal-web from git repo

For development, run the client application via

```bash
npm run dev
```

The application will run at `http://localhost:5173`.

To test a production build, first execute

```bash
npm run build
```

And then

```bash
npm run preview
```

Also in this case the application runs at `http://localhost:5173`.
