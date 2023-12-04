
# Fractal Web Client

Fractal is a framework to process high-content imaging data at scale and prepare it for interactive visualization.

![Fractal_Overview](https://fractal-analytics-platform.github.io/assets/fractal_overview.jpg)

Fractal provides distributed workflows that convert TBs of image data into OME-Zarr files. The platform then processes the 3D image data by applying tasks like illumination correction, maximum intensity projection, 3D segmentation using [cellpose](https://cellpose.readthedocs.io/en/latest/) and measurements using [napari workflows](https://github.com/haesleinhuepf/napari-workflows). The pyramidal OME-Zarr files enable interactive visualization in the napari viewer.

This is the repository that contains the **Fractal web client**. Find more information about Fractal in general and the other repositories at the [Fractal home page](https://fractal-analytics-platform.github.io).

Documentation for `fractal-web` (in progress) is available at https://fractal-analytics-platform.github.io/fractal-web.

## License and contributors

Unless otherwise stated in each individual module, all Fractal components are
released according to a BSD 3-Clause License, and Copyright is with Friedrich
Miescher Institute for Biomedical Research and University of Zurich.

Fractal was conceived in the Liberali Lab at the Friedrich Miescher Institute
for Biomedical Research and in the Pelkmans Lab at the University of Zurich by
[@jluethi](https://github.com/jluethi) and
[@gusqgm](https://github.com/gusqgm). The Fractal project is now developed at
the [BioVisionCenter](https://www.biovisioncenter.uzh.ch/en.html) at the
University of Zurich and the project lead is with
[@jluethi](https://github.com/jluethi). The core development is done under
contract by [eXact lab S.r.l.](https://www.exact-lab.it/).
