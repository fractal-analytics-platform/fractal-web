---
title: Datasets
description: What a Fractal dataset is, what it contains, and how workflows read from and write to it.
---

# Datasets

--8<-- "datasets.md"

## Why datasets exist

Fractal runs workflows on your OME-Zarrs. The Fractal server doesn't
necessarily have direct access to the OME-Zarr data on your cluster, but
through the dataset, it keeps track of what OME-Zarrs you have created and how
they have been processed. This lets it set up the correct parallelization
patterns for your workflows, show you per-image processing statuses, and offer
choices on the workflow submission screen (e.g. running on only a subset of
your dataset).

## What a dataset contains

A Fractal dataset contains an image list, processing history, and some dataset metadata.

In its simplest form, the image list is just a list of `zarr_urls`: the paths
or URLs where the OME-Zarr images can be found. Each OME-Zarr will contain
image data and optionally label data or tabular data (like ROI tables or
feature tables). To make sense of a potentially long list of `zarr_urls`, each
item in the image list can contain two kinds of metadata: `attributes` and
`types`.

`Attributes` are free-form information about an OME-Zarr: does it belong to
`well` A01 or A02 in an HCS `plate`? Is it part of a multiplexing
`acquisition`? Was a specific treatment applied to the sample contained in an
OME-Zarr (e.g. a drug was used at a given concentration)? Attributes are used
to allow you to select subsets of your dataset for processing and easily find
relevant OME-Zarrs in large collections. They can be strings, numbers or
booleans.

`Types` are binary information about your OME-Zarr. They are used for dividing
a dataset into distinct groups that are used in processing. Key examples are
having both 3D and 2D data in the same dataset, differentiated by the `is_3D`
type, or having raw and illumination-corrected images, where the
illumination-corrected ones carry the `illumination_corrected` type. These
types allow running workflows on the relevant version of your data and stop
you from e.g. applying illumination correction twice to the same OME-Zarr.

To learn more about the Fractal image list, check out <a href="https://fractal-analytics-platform.github.io/image_list/" target="_blank">https://fractal-analytics-platform.github.io/image_list</a>.

On top of the image list, the Fractal dataset also stores its processing
history. This history provides a record of how any image in your dataset was
processed: which task was used? With what parameters? Did the task run
successfully or fail on a given image?

Dataset metadata primarily consists of the dataset's name and ID, as well as
the `zarr_dir` set during its creation. The `zarr_dir` is the location where
any Fractal task saves newly created OME-Zarrs for a given dataset.

## How workflows use datasets

A [workflow](workflows.md) runs on a dataset, reading its image list and
optionally updating the image list with new images or new metadata about existing
images. Additionally, it updates the dataset history.

??? note "Under the hood"

    TODO — Write up more involved details on the dataset
    zarr_dir (how they are set & constrained to project_dirs),
    how all OME-Zarrs go into the zarr_dir
    the image list structure,
    the task API to update the image list
    dataset history

## Related

- Reference: [Dataset page](../reference/dataset.md)
- Concepts: [Projects](projects.md) · [Workflows](workflows.md)
