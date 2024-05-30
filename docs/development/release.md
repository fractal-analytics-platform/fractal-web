## Release

Steps to release a new `fractal-web` version:

* Update `CHANGELOG.md` on `main` branch, replacing the "Unreleased" temporary title with the desidered version number
* Update the `version-compatibility.md` doc page
* Commit the changes
* Execute `npm version <major|minor|patch>`
* Execute `git push origin main`
* Execute `git push origin <new-version-tag>`
* Update the GitHub release page with the information from `CHANGELOG.md`

> NOTE: Pushing a new version tag (like v5.6.7) triggers [a dedicated GitHub
> action](https://github.com/fractal-analytics-platform/fractal-web/blob/main/.github/workflows/github_release.yaml),
> which also creates build artifacts (based on `npm pack`) and attaches them to
> the GitHub release.
