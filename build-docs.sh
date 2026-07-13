#!/bin/sh

# Cleanup previous build
rm -Rf site
rm -Rf docs/help

# Build Standard User Guide
uv run --frozen zensical build --strict --clean --config-file=help/zensical.toml
mv help/site docs/help

# Build Minimal User Guide
sed -i 's/extra_css = \[\(.*\)\]/extra_css = [\1, "minimal.css"]/' help/zensical.toml
FRACTAL_LINKS_TARGET_BLANK=true uv run --frozen zensical build --strict --clean --config-file=help/zensical.toml
mv help/site docs/help/minimal
git checkout -- help/zensical.toml

# Build main docs
uv run --frozen zensical build --strict --clean
