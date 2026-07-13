#!/bin/sh

help_config_file="help/zensical.toml"
unstaged_changes=`git diff --name-only -- "$help_config_file"`

if [ ! -z "$unstaged_changes" ]; then
  echo "The file $help_config_file has unstaged changes, please stage the changes or undo them before running this script."
  exit 1
fi

# Cleanup previous build
rm -Rf site
rm -Rf docs/help

# Build Standard User Guide
uv run --frozen zensical build --strict --clean --config-file="$help_config_file"
mv help/site docs/help

# Build Minimal User Guide
sed -i 's/extra_css = \[\(.*\)\]/extra_css = [\1, "minimal.css"]/' "$help_config_file"
FRACTAL_LINKS_TARGET_BLANK=true uv run --frozen zensical build --strict --clean --config-file="$help_config_file"
mv help/site docs/help/minimal
git restore "$help_config_file"

# Build main docs
uv run --frozen zensical build --strict --clean
