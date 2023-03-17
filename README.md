# Fractal Web Client

Fractal is a framework to process high-content imaging data at scale and prepare it for interactive visualization.

![Fractal_Overview](https://fractal-analytics-platform.github.io/assets/fractal_overview.jpg)

Fractal provides distributed workflows that convert TBs of image data into OME-Zarr files. The platform then processes the 3D image data by applying tasks like illumination correction, maximum intensity projection, 3D segmentation using [cellpose](https://cellpose.readthedocs.io/en/latest/) and measurements using [napari workflows](https://github.com/haesleinhuepf/napari-workflows). The pyramidal OME-Zarr files enable interactive visualization in the napari viewer.

This is the repository that contains the **Fractal web client**. Find more information about Fractal in general and the other repositories at the [Fractal home page](https://fractal-analytics-platform.github.io).

# Instructions

## Environment setup

Version 18 or 19 of Node.js is needed (check your version with `node -v`).
If these versions are not available via your favorite package installer, you can install them from [this link](https://nodejs.org/en/download) for your specific platform. Another option is to use [nvm](https://github.com/nvm-sh/nvm), e.g. via
```bash
nvm install 19
nvm alias default 19
```

Clone this repository
```bash
git clone https://github.com/fractal-analytics-platform/fractal-web.git
cd fractal-web
```

Install the package
```bash
npm install
```

## Web client startup

Create a `.env` file where you set the relevant environment variables. At the moment this includes a single variable:
```
PUBLIC_FRACTAL_SERVER_HOST=http://127.0.0.1:8000
```

Run the application via
```bash
npm run dev -- --open
```

The application is now running at `http://localhost:5173`.

## Notes on fractal server configuration

It is necessary that the fractal server instance is reachable by the client by network connection.

It is also important to set the server environment variable `JWT_EXPIRE_SECONDS` to a relevant value
for the user to persist its session on the client.
The client authenticate the user by mean of a JWT token that is received from the fractal server.
The default value set by the server is 180 seconds, after that the token expires and the user is required to login again
in order for the client request to be authorized.
For user experience reasons, it is suggested to set the `JWT_EXPIRE_SECONDS=84600` on the server.

**Note**: The [example_server_startup folder](tests/data/example_server_startup) contains an example of how to install and startup a `fractal-server` instance.

# Contributors

Fractal was conceived in the Liberali Lab at the Friedrich Miescher Institute for Biomedical Research and in the Pelkmans Lab at the University of Zurich (both in Switzerland). The project lead is with [@gusqgm](https://github.com/gusqgm) & [@jluethi](https://github.com/jluethi). The core development is done under contract by [eXact lab S.r.l.](exact-lab.it).
