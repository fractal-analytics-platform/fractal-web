
# Fractal Web Client

Fractal is a framework to process high-content imaging data at scale and prepare it for interactive visualization.

![Fractal_Overview](https://fractal-analytics-platform.github.io/assets/fractal_overview.jpg)

Fractal provides distributed workflows that convert TBs of image data into OME-Zarr files. The platform then processes the 3D image data by applying tasks like illumination correction, maximum intensity projection, 3D segmentation using [cellpose](https://cellpose.readthedocs.io/en/latest/) and measurements using [napari workflows](https://github.com/haesleinhuepf/napari-workflows). The pyramidal OME-Zarr files enable interactive visualization in the napari viewer.

This is the repository that contains the **Fractal web client**. Find more information about Fractal in general and the other repositories at the [Fractal home page](https://fractal-analytics-platform.github.io).

# Client architecture

The client is a Svelte application that uses [SvelteKit](https://kit.svelte.dev) as a framework.
The application is composed of a set of pages that are rendered by a node server and served to a client browser.
The node server acts as a proxy to the fractal server, forwarding the requests to the server and returning the responses to the client.

More details can be found at:

1. [How to run/develop fractal-web](docs/contribute.md)
2. [How to run fractal-server](docs/fractal_server.md)
3. [Deployment examples](docs/examples.md)
3. [Project structure](docs/structure.md)
3. [Tests](docs/tests.md)
4. [Dependencies](docs/dependencies.md)
5. [JSON Schemas for WorkflowTask arguments](docs/json_schemas.md)
6. [CHANGELOG](CHANGELOG.md)

# Contributors

Fractal was conceived in the Liberali Lab at the Friedrich Miescher Institute for Biomedical Research and in the Pelkmans Lab at the University of Zurich (both in Switzerland). The project lead is with [@gusqgm](https://github.com/gusqgm) & [@jluethi](https://github.com/jluethi). The core development is done under contract by [eXact lab S.r.l.](https://exact-lab.it).
