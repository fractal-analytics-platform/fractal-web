*Note: Numbers like (\#123) point to closed Pull Requests on the fractal-web repository.*

# 0.10.1

* Fixed bug in workflow task meta properties update (\#422).

# 0.10.0

This release requires fractal-server 1.4.6.

* Improved id and timestamp layout on jobs table (\#420).
* Added query parameters to avoid loading unused fields on the following GET endpoints (\#420):
    * `/api/v1/job/`, `/api/v1/{project.id}/job/`, `/admin/job/` (`log` param)
    * `/api/v1/task/` (`args_schema` param)
    * `/api/v1/dataset/`, `/api/v1/project/{project.id}/dataset/` (`history` param)
* Added `show_tmp_logs=true` query parameter to display log of running jobs (\#420).

# 0.9.2

* Supported JSON Schema `allOf` feature in task arguments form (\#417).

# 0.9.1

* Improved visualization of details on job logs modal (\#415).
* Added job id filter on admin jobs page (\#415).
* Added spinner on workflow task modal when tasks list is loading (\#410).
* Implemented import and export of workflow task arguments (\#410).
* Improved sorting of users in dropdown of the admin jobs page (\#402).
* Fixed bug in retrieval of job log from the admin jobs page (\#402).
* Highlighted relevant part of the error message in workflow job log modal (\#402).
* Made the error message directly accessible from the new workflow page (\#402).

# 0.9.0

This release requires fractal-server 1.4.3.

* Removed `running` job status (\#401).
* Aligned timestamp definitions with fractal-server 1.4.3 (\#401).
* Sorted projects by descending creation timestamp (\#401).
* Removed coverage setup from Playwright tests and CI (\#399).

# 0.8.2

* Improvements on worflow task form (\#393):
    * supported JSON Schema `enum` type;
    * supported JSON Schema `minimum`, `maximum`, `exclusiveMinimum` and `exclusiveMaximum` for numeric types;
    * supported JSON Schema `minItems` and `maxItems` for array type;
    * supported reordering of array fields;
    * set bold font on nested required properties;
    * improved field validation error messages.
* Add trailing slash to OAuth-callback url (\#395).

# 0.8.1

Note: with this release, `PUBLIC_FRACTAL_ADMIN_SUPPORT_EMAIL` becomes a required
environment variable, and `npm run build` fails if it is missing. If you do not
need a support email, just include a `PUBLIC_FRACTAL_ADMIN_SUPPORT_EMAIL=` line in
your env file.

* Made `PUBLIC_FRACTAL_ADMIN_SUPPORT_EMAIL` static (\#391).
* Added SLURM-account selection for user editing and for job execution (\#391).
* Improved buttons feedback for slow API calls (\#389).

# 0.8.0

This release requires fractal-server 1.4.2.

* Users registered by the admin are automatically verified (\#386).
* A warning message is displayed to unverified users (\#386).
* Made page headers more homogeneous (\#386).
* Replaced some icons with more suitable ones (\#386).
* Added search boxes on datasets, workflows and workflow tasks selection (\#386).
* Moved "Create new workflow" to a modal (\#386).
* Added search project field on projects list page (\#379).
* Used modal to create new project (\#379).
* Sorted users in admin-area page (\#379).
* Exposed stop-job and download-logs in admin-area jobs page (\#379).
* Displayed number of rows in admin jobs page (\#379).
* Fixed semver circular dependency issue (\#379).
* Fixed issue with version sorting (\#379).
* Sorted datasets by name (\#379).
* Fixed accessibility issue (\#379).
* Improved performance reducing the number of API calls on project, workflow and dataset pages (\#379).

# 0.7.2

Note: with this release, `PUBLIC_OAUTH_CLIENT_NAME` becomes a required
environment variable, and `npm run build` fails if it is missing. If you do not
need OAuth2 authentication, just include a `PUBLIC_OAUTH_CLIENT_NAME=` line in
your env file.

* Made `PUBLIC_OAUTH_CLIENT_NAME` static (\#376).
* Added help messages to user registration (\#376).
* Made `AUTH_COOKIE_DOMAIN` optional (\#376).
* Fixed hardcoded OAuth2 variable (\#376).

# 0.7.1

* Auto-refresh of tasks table when a tasks collection completes successfully (\#364).
* Auto-refresh of tasks collection status (\#364).
* Made tasks list more compact by hiding the older versions (\#364).
* Added the following fields on single task creation:
    * args schema file upload (\#364).
    * meta file upload (\#364).
    * docs info and docs link (\#364).
* Added editing of pinned package versions on tasks collection (\#364).
* Supported editing of `cache_dir` from user profile page (\#365).
* Added experimental workflow page with job monitoring (\#363).

# 0.7.0

This release requires fractal-server 1.4.0.

* Added admin jobs page (\#352).
* Fixed expiration token issue for /admin and /auth endpoints (\#352).
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
