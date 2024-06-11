# Sandbox pages

When developing tasks it can be useful to have a quick way to test how a given JSON schema will appear in the workflow task arguments form or how a task version update will affect the users.

When running fractal-web in development mode it is possible to use 2 sanbox pages:

* JSON Schema Sandbox page: http://localhost:5173/sandbox/jsonschema
* Task Version Update Sandbox page: http://localhost:5173/sandbox/version

Both these pages provide a textarea for the JSON schemas. Notice that you can't paste the whole task manifest: you need to pick one of the `args_schema` values.

> The pages are visible only when the application is started in development mode, so typically when using `npm run dev`. It can be used also when fractal-server is not running.

It is preferable to use `npm run dev` if you want to access the Sandbox pages. If for any reason you need to use `npm run preview` consider that it works reading the files from the build folder. These files by default are built with the production mode set, so the only way to see the Sandbox pages when using `npm run preview` is to build the application using `npx vite build --mode development`.
