# JSON Schema Sandbox

When developing tasks it can be useful to have a quick way to test how a given JSON schema will appear in the workflow task arguments form. This can be done using the fractal-web Sandbox JSON Schema page, accessible at the following URL:

http://localhost:5173/sandbox/jsonschema

Notice that you can't paste the whole task manifest: you need to pick one of the `args_schema` values.

> The page is visible only when the application is started in development mode, so typically when using `npm run dev`. It can be used also when fractal-server is not running.

It is preferable to use `npm run dev` if you want to access the Sandbox page. If for any reason you need to use `npm run preview` consider that it works reading the files from the build folder. These files by default are built with the production mode set, so the only way to see the Sandbox page when using `npm run preview` is to build the application using `npx vite build --mode development`.
