# Documentation

Here are the instructions to serve the documentation on localhost:8001:

```bash
uv sync --frozen
uv run zensical serve --dev-addr localhost:8001
```

The documentation includes links to the sandbox pages.
These pages are built separately and added to the site folder by the CI before publishing the documentation, so these links will not work when using the `zensical` preview command displayed above.
If you want to preview the sandbox pages run `npm run dev` inside the sandbox folder.
