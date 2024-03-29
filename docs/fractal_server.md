# Basic guide for fractal-server startup

The [`lib/fractal-server`](../lib/fractal-server/) folder describes the basic
steps to install and run a local `fractal-server` instance, that can be then
accessed through `fractal-web`.

Briefly, one should:
* Install fractal-server (`pip install fractal-server`);
* Set up the database (`fractalctl set-db`);
* Startup an instance (`fractalctl start`).

Notes:
1. There must exist a `.fractal_server.env` file (see example in
   `../lib/fractal-server/`), with some configuration variables.
2. It is necessary that the fractal-server instance is reachable from the
   client by network connection (this is typically trivial, if fractal-server
   is run locally e.g. at http://localhost:8000). This address also needs to match
   the one in the `fractal-web` configuration file (either `.env` or
   `.env.development`, depending on how you are running `fractal-web`).
3. It is useful to set the fractal-server environment variable
   `JWT_EXPIRE_SECONDS` to a relevant value for the user to persist its session
   on the client (e.g. `JWT_EXPIRE_SECONDS=84600`).
4. The configuration env file also defines some default credentials for an
   admin user, that can be used for testing.
