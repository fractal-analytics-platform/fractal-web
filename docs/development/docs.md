# Documentation

Here are the instructions to serve the documentation on localhost:8001:

```bash
python -m venv venv
source venv/bin/activate
python -m pip install -r docs/doc-requirements.txt
mkdocs serve --dev-addr localhost:8001
```
