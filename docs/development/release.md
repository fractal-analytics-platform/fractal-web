## Release

Steps to release a new `fractal-web` version:

* Update `CHANGELOG.md` on `main` branch, replacing the "Unreleased" temporary title with the desidered version number
* Update the `version-compatibility.md` doc page
* Commit the changes
* Execute `npm version <major|minor|patch>`
* Execute `git push origin main`
* Execute `git push origin <new-version-tag>`
* Update the GitHub release page with the information from `CHANGELOG.md`
