## Release

Steps to release a new `fractal-web` version:

* Update `CHANGELOG.md` on `main` branch, replacing the "Unreleased" temporary title with the desidered version number
* Execute `npm version <major|minor|patch>`
* Execute `git push origin main`
* Execute `git push origin <new-version-tag>`
