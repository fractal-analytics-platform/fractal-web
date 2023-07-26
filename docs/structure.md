# Code-base structure

This project is based on [svelte kit](https://kit.svelte.dev) and follows its conventions and structure.

## 1-level folders

By default, the main application folder is located at `/src`.
The structure of this folder is explained in depth
in [svelte kit docs](https://kit.svelte.dev/docs/project-structure#project-files)

`/static` is a folder related to static files that will be served by the client server.
More on this could be found in
the [svelte kit docs](https://kit.svelte.dev/docs/project-structure#project-files-static).

The `/lib` folder contains files and sources that enable correct instrumentation and testing of this client application.
Currently, within this folder are present files to support the project's unit tests arrangements and other
library files to populate local instances of the fractal server in order to test the client.

As for testing, currently, there are two folders `/__tests__` and `/tests`.
The former contains files of unit tests executed by `vitest` and the latest
is related to `playwright` testing.
This structure could be improved and organized differently by updating project configuration files,
specifically `vite.config.js` and `playwrght.config.js` which are located at project root.

`/examples` folder contains configuration guidance to set up local environments to test different
fractal server / fractal web interoperability architectures.

`/docs` folder is the root of the project docs files.

```
[project root]
├ /src
├ /static
├ /lib
├ /__tests__
├ /tests
├ /examples
├ /docs
```

## Application structure

With reference to `/src/routes` folder, therein are defined svelte kit page components
that structure the fractal web client.

> It is important to mention that, this client application
> is [server-side rendered](https://kit.svelte.dev/docs/glossary#ssr).
> By default, this is the default behaviour of [svelte kit](https://kit.svelte.dev/docs/introduction#sveltekit-vs-svelte).

> Before proceeding, it is important to understand the distinction of files terminating with the suffix `+[.]server.js`.
> Those files are explicitly processed by the client's server. 