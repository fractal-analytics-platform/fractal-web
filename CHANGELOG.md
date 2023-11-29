*Note: Numbers like (\#123) point to closed Pull Requests on the fractal-web repository.*

# 0.7.0 (unreleased)

This release requires fractal-server 1.4.0.

* Used new endpoints for retrieving current user and list of users (\#350).
* Added user profile page (\#336).
* Added admin area with users management (\#336).
* Added Jobs button in home page (\#346).
* Improved jobs table layout for small screens (\#346).
* Fixed jobs status badge color bug (\#346).
* Aligned with fractal-server 1.4.0 API, including trailing slash for endpoints' paths (\#328).
* Added spinner during page loading (\#328).
* Job pages:
    * Created per-user and per-workflow jobs pages (\#328).
    * Removed per-project jobs pages (\#328).
    * Added automatic background update job pages (\#328).
* Improved handling of session expiration (\#333).
* Fixed logout bug (\#327).
* Implemented OAuth2 login (\#333).
* Added more playwright tests (\#332).

# 0.6.3

* Implemented task-version update (\#325).

# 0.6.2

* Fixed peformance issue with argument-description popovers (\#324).
* Added end-to-end tests and coverage configuration (\#320).

# 0.6.1

This release works best with fractal-server >=1.3.12 (since it makes use of the
`dataset.history` property), but previous fractal-server versions are still
supported.

* Added dataset history modal (\#316).
* Fixed bug with save/discard changes in workflow task (\#315).
* Fixed first-run redirects issue (\#315).

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
