# Sandbox pages

When developing tasks it can be useful to have a quick way to test how a given JSON schema will appear in the workflow task arguments form or how a task version update will affect the users.

The following sandbox pages are available:

* [JSON Schema Sandbox page](../sandbox\#jschema)
* [Task Version Update Sandbox page](../sandbox\#version-update)

Both these pages provide a textarea for the JSON schemas. Notice that you can't paste the whole task manifest: you need to pick one of the `args_schema` values.

To locally preview the sandbox pages enter the `sandbox` directory and run:

```bash
npm install
npm run dev
```
