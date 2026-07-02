#!/bin/sh

rm -Rf site
rm -Rf docs/help
uv run --frozen zensical build --strict --clean --config-file=help/zensical.toml
mv help/site docs/help
uv run --frozen zensical build --strict --clean --config-file=help/minimal.toml
mv help/site docs/help/minimal
uv run --frozen zensical build --strict --clean
