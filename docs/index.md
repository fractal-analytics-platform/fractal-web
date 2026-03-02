
# Fractal Web Client

## Fractal

<p align="center">
  <img src="https://raw.githubusercontent.com/fractal-analytics-platform/fractal-logos/refs/heads/main/projects/fractal_web.png" alt="Fractal web" width="400">
</p>

Fractal is a framework developed at the [BioVisionCenter](https://www.biovisioncenter.uzh.ch/en.html) to process bioimaging data at scale in the OME-Zarr format and prepare the images for interactive visualization.

![Fractal overview](https://github.com/user-attachments/assets/666c8797-2594-4b8e-b1d2-b43fca66d1df)

This is the repository that contains the **Fractal web client**. Find more information about Fractal in general and the other repositories at the [Fractal home page](https://fractal-analytics-platform.github.io).

## Web client architecture

The client is a Svelte application that uses [SvelteKit](https://kit.svelte.dev) as a framework.
The application is composed of a set of pages that are rendered by a node server and served to a client browser.
The node server acts as a proxy to the fractal server, forwarding the requests to the server and returning the responses to the client.
Find more details in specific pages.

## License and contributors

The Fractal project is developed by the [BioVisionCenter](https://www.biovisioncenter.uzh.ch/en.html) at the University of Zurich, who contracts [eXact lab s.r.l.](https://www.exact-lab.it/en/) for software engineering and development support.

Unless otherwise specified, Fractal components are released under the BSD 3-Clause License, and copyright is with the BioVisionCenter at the University of Zurich.
