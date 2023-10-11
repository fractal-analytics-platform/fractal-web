*Note: Numbers like (\#123) point to closed Pull Requests on the fractal-web repository.*

# Unreleased

# 0.6.0

* Added fractal-web version to the footer (\#312).
* Added new modal for create/update dataset feature (\#310).
* Standardized modal management to fix some bugs (\#306).
* Added proxy endpoints and refactored error propagation (\#288).
* Remove use of deployment-type `fractal-server` variable (\#298).
* Add GitHub action to create GitHub releases (\#305).
* Add a BSD3 license (\#300).

# 0.5.6

* Improve displaying of `Dataset.meta` properties (\#281).
* Remove obsolete file `src/routes/api/alive/+server.js` (\#283).

# 0.5.5

* Fix bug in `JSchema.svelte` (\#279).

# 0.5.4

* Always propagate cookie for API calls to `FRACTAL_SERVER_HOST`, even for different domains (\#275).

# 0.5.3

* Add confirmation dialog for delete-task operation (\#272).
* Enable WorkflowTask Info tab, and render `docs_info` from markdown (\#271).
* Update import-workflow feature (\#269).
* Revamp home page and user-related layout (\#259).
* Review logout action (\#259).
* Implement editing and deletion of tasks (\#207, \#268). 
* Implement A-to-B workflow execution (\#254).
* Fix WorkflowTask `meta` update (\#261).
* Improve enable/disable button state, for project/dataset/workflow/resource creation (\#257).

# 0.5.2

* Improve tasks handling within the client (\#233).
* Prevent accidental loss of user-provided WorkflowTask arguments (\#234).

# 0.5.1

First release included in this CHANGELOG.
