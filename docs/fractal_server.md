# Basic guide for fractal-server startup

A brief description on how to startup fractal-server, to experiment with fractal-web.
This is in principle already self-contained in a given example repo folder (now in `../lib/fractal-server/example_server_startup`), but we can perhaps summarize here the key steps (how to install, what should go in a `.fractal_server.env` file, and what commands are needed).
## Notes on fractal server configuration

It is necessary that the fractal server instance is reachable by the client by network connection.

It is also important to set the server environment variable `JWT_EXPIRE_SECONDS` to a relevant value
for the user to persist its session on the client.
The client authenticate the user by mean of a JWT token that is received from the fractal server.
The default value set by the server is 180 seconds, after that the token expires and the user is required to login again
in order for the client request to be authorized.
For user experience reasons, it is suggested to set the `JWT_EXPIRE_SECONDS=84600` on the server.

**Note**: The [example_server_startup
folder](../lib/fractal-server/example_server_startup) contains an example of
how to install and startup a `fractal-server` instance.
