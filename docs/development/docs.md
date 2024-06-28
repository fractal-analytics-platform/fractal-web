# Documentation

Here are the instructions to serve the documentation on localhost:8001:

```bash
python -m venv venv
source venv/bin/activate
python -m pip install -r docs/doc-requirements.txt
mkdocs serve --dev-addr localhost:8001
```

The documentation includes links to the sandbox pages. These pages are built separately and added to the site folder by the CI before publishing the documentation, so these links will not work using the mkdocs preview command displayed above. If you want to preview the sandbox pages run `npm run dev` inside the sandbox folder.
