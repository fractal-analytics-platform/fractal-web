Basic instructions to get a fractal-server instance running (see see [fractal-server documentation](https://fractal-analytics-platform.github.io/fractal-server/install_and_deploy/) for more details).


1. Setup a Python environment with `fractal-server`, e.g. via
```console
python3 -m venv myenv
source myenv/bin/activate
pip install fractal-server==1.3.4
```

2. Verify that the `.fractal_server.env` file exists.

3. Set up the database with
```console
fractalctl set-db
```

4. Start up a fractal-server instance on port 8000 via
```console
fractalctl start --port 8000
```

To cleanup the database it is sufficient to remove `test.db`.
