*Note: Numbers like (\#123) point to closed Pull Requests on the fractal-web repository.*

# Unreleased

* Implemented Pixi task collection (\#812);

# 1.18.5

* Changed default first task selection logic (\#810);

# 1.18.4

* Added `workflowtask_id` query parameter to `verify-unique-types` API call (\#809);
* Fixed form enter in task collection component (\#809);

# 1.18.3

* Dropped semver and used API task-groups ordering (\#803);
* Parsed timestamps in `admin/accounting` (\#803);

# 1.18.2

* Retrieved image status from `__wftask_dataset_image_status__` attribute (\#801);

# 1.18.1

* Used new API endpoint to detect task version upgrade (\#792);
* Handled arguments schema changes in workflow task runs (\#796);
* Added Run tab in workflow page (\#796);
* Improved handling of viewer paths errors (\#796);
* Added converter non parallel and converter compound to task creation form (\#796);

# 1.18.0

* Upgrade to Svelte 5 (\#789);

# 1.17.4

* Fixed search box not working in workflow submission modal (\#787);
* Fixed "Get token" button not working in Safari (\#787);
* Added a disclaimer to non-processed-images warning (\#787);

# 1.17.3

* Displayed warning when attempting to continue a workflow on unprocessed images (\#774);
* Added "Get URL" button for plates on dataset page (\#774);
* Fixed workflow status update issue (\#774);

# 1.17.2

* Added `NEWS_INFO_PATH` variable to display news in home page (\#773);
* Displayed SLURM accounting also for slurm_ssh backend (\#773);

# 1.17.1

* Fixed "Continue workflow" for legacy workflows (\#772);

# 1.17.0

* Workflow task flexibility (\#759):
    * Added image list modal in workflow page;
    * Displayed workflow runs in expansible subsections, with frozen arguments;
    * Supported both new and legacy workflow statuses;
    * Displayed per-image logs in workflow image list;
    * Displayed run logs in workflow page;
    * Exposed type filters in workflow submission modals;
    * Added job-submission warning when there are images with different values for some types;
* Dropped support for dataset type/attribute filters and removed environment variable `ENABLE_INTERACTIVE_ATTRIBUTE_FILTERS` (\#759);
* Added a "Get URL" button to image list (\#759);
* Supported converter task types (\#759);
* Made user sorting case insensitive (\#759);
* Moved tasks table links to the info modal (\#759);
* Removed "Download token" button from profile page, added "Get token" button to main dropdown menu (\#759);
* Added job cancellation received message to the workflow page (\#767);

# 1.16.2

* Fixed task version sorting issue (\#733);

# 1.16.1

* Improved handling of new default values in task version update (\#731);

# 1.16.0

* Used `FRACTAL_BACKEND_RUNNER=local` instead of `local_experimental` (\#713);
* Moved job submission healthcheck page to user menu (\#713);
* Fixed bug in task-groups deletion in admin page (\#713);
* Fixed bug in task order modal drag and drop (\#713);
* Added admin accounting page (\#713);
* Implemented user impersonation (\#713);
* Improved error handling in proxy functions and documented the usage of Svelte Kit `BODY_SIZE_LIMIT` environment variable (\#713);

# 1.15.0

* Added type filters flow modal (\#701);
* Pre-populated the image zarr_url (\#703);
* Added validation for type filters and input types compatibility (\#703);
* Displayed input/output task type in "Type" tab on workflow page (\#691);
* Removed dataset filters modal, implemented editing of dataset filters directly inside the image list table (\#691);
* Refactored code to new filters format and sent selected filters in run workflow modal (\#686);
* Displayed list of images that would be processed by the first task of a job (\#686);
* Added environment variable `ENABLE_INTERACTIVE_ATTRIBUTE_FILTERS`, to enable attribute filters on the "Run workflow" modal (\#686);
* Fixed findings based on `zizmor 1.0.1` audit (\#687).

# 1.14.0

* Removed legacy version support (\#684);
    * Removed the environment variables `FRACTAL_API_V1_MODE` and `TEST_VERSION`;

# 1.13.1

* Tasks table improvements (\#677):
    * Handled install instructions (\#677);
    * Made task name a link pointing to `docs_link` (\#677);
    * Removed `input_types` column (\#677);
* Fixed task group activity wrong admin API call (\#677);
* Used new replace-task endpoint for version update (\#677);
* Fixed version update for deactivated tasks (\#677);

# 1.13.0

* Moved `jschema` and other common components to a dedicated`components` module (\#671);
* Added `tasks-list` module to generate the tasks-list static page (\#671);

# 1.12.0

* Used form data in tasks collection endpoint (\#669);

# 1.11.2

* Removed usage of `cache_dir` field (\#667);

# 1.11.1

* Added tasks search filters (\#658);
* Split standard-user tasks page into "tasks page" vs "tasks management page" (\#658);
* Added alive endpoint (\#658);
* Added user column and sorted users by email in `/v2/admin/task-groups/activities` (\#658);

# 1.11.0

* Alignment with fractal-server 2.9.0 (\#640, \#643, \#652, \#655):
    * Updated task collections logic and created task-group activities pages for standard users and administrators (\#640);
    * Removed active checkbox from task group edit modal (\#640);
    * Added Manage button to deactivate and reactivate task groups (\#640);
    * Removed usage of DB_ENGINE and SQLITE_PATH variables (\#643);
    * Displayed `timestamp_last_used` property in task-group info modal (\#643);
    * Viewer paths page improvements (\#643);
    * Added manage buttons on admin task-groups page (\#643);
    * Added last used timestamp filter to task-group admin page (\#643);
    * Used new `GET /auth/current-user/allowed-viewer-paths/` endpoint (\#652);
    * Added "Download token" button in "My profile" page (\#652);
    * Implemented removal of users from group (\#655);
    * Implemented import of user settings from another user (\#655);
    * Used new set-groups endpoint (\#655);
    * Sorted task-group activities by timestamp_started (more recent first) (\#655);

# 1.10.1

* Fixed wrong workflow tasks order after task version update (\#637);

# 1.10.0

* Added project dir setting (\#634);
* Made zarr_dir optional when creating dataset (\#634);
* Updated query parameters of GET /api/v2/task/ (\#634);
* Displayed task collection logs also in install phase (\#634);
* Handled missing banner file error (\#634);
* Used fractal-logos sources for README and docs (\#634);
* Added fractal logo (\#626);
* Removed usage of pip extras when installing fractal-server for testing (\#626);
* Removed usage of verbose query parameter in task collection (\#626);

# 1.9.0

* Alignment with fractal-server 2.7 (\#583, \#601, \#605, \#612, \#616, \#620):
    * Removed owner from v2 tasks (\#583);
    * Displayed workflow task warning message (\#583);
    * Implemented selection of group in task creation (\#583);
    * First implementation of new workflow task modal (\#583);
    * Used new group_ids_names field (\#583);
    * Renamed source to label in custom python env task creation (\#583);
    * Changes to admin tasks page (\#583, \#601);
    * Changed task list to use task groups (\#601);
    * Changes to job submission healthcheck page (\#601);
    * Implemented task group modal info, edit and delete (\#601);
    * Removed usage of source field (\#601);
    * Filtered identical task groups (\#605);
    * Removed order field from workflow task modal (\#605);
    * Disabled editing of task name (\#605);
    * Added user group setting editor form (\#612);
    * Supported deletion of groups (\#612);
    * Sorted tasks by id (\#616);
    * Created healthcheck task as private (\#616);
    * Used args_schema=false in GET /api/v2/task-group/ (\#616);
    * Ignored empty task groups (\#616);
    * Checked pkg_name while computing workflow task update candidates (\#616);
    * Added admin task groups page (\#620);
* Fixed dropdown style (\#601);
* Changed "new version available" icon (\#583);
* Login page layout improvements (\#605);
* Fixed issue when editing user after setting the superuser privilege (\#612);
* Used response.data.version when displaying task collections (\#616);
* Implemented reordering of tasks in workflow using drag and drop (\#616);
* Fixed broken unsaved changes modal, for non-JSON-schema-based workflowtask edits (\#616);
* Refactored user editing form using only one save button (\#616);
* Allowed same key for attribute and type in input filters (\#620);

# 1.8.0

* Drop Node 16 support (\#574);
* Upgraded dependencies (\#574):
    * svelte: 3.x -> 4.x
    * @sveltejs/kit: 1.x -> 2.x
    * @sveltejs/adapter-node: 1.x -> 2.x
    * @sveltejs/adapter-static: 2.x -> 3.x
    * eslint: 8.x -> 9.x
    * typescript: 4.x -> 5.x
    * vite: 4.x -> 5.x
    * vitest: 0.x -> 1.x
    * @vincjo/datatables: 1.6.0 -> 1.14.10
    * bootstrap: 5.2.3 -> 5.3.3

# 1.7.2

* Added viewer paths editor in admin area (\#571);
* Added user viewer paths page (\#571);

# 1.7.1

* Allowed null values in settings API requests (\#570);
* Hided cache dir from user settings page when using SSH Slurm (\#570);
* Made FRACTAL_RUNNER_BACKEND environment variable mandatory (\#570);

# 1.7.0

* Added "My Settings" page and updated admin user editor (\#564);
* Fixed duplicated entries in owner dropdown (\#562);
* Added "View plate" button on dataset page (\#562);
* Improved stability of end to end tests (\#560);

# 1.6.0

* Displayed OAuth2 accounts in user profile page (\#557);
* Supported `FRACTAL_API_V1_MODE=include_read_only` (\#557);
* Added support for displaying temporary warning banner using the `WARNING_BANNER_PATH` environment variable (\#557);
* Deprecated support for legacy tasks in V2 workflows (\#554);

# 1.5.0

* Implemented functionality for creating and displaying user groups (\#551);
* Displayed an error when job submission failed before starting execution of tasks (\#548);

# 1.4.3

* Added settings page to admin area (\#544);

# 1.4.2

* Added admin page for job submission healthcheck (\#543);

# 1.4.1

* Raised a warning upon import/export of a workflow with a custom task (\#542);
* Experimental feature: added vizarr viewer links to dataset page (\#542);
* Used links instead of the "Open" button (\#542);
* Added documentation about systemd service config (\#542);
* Added e2e testing of OAuth2 login (\#542);
* Improved handling of validation errors on forms and documentation about error handling (\#542);
* Added `white-space: pre-wrap` on all `pre` tags (\#542);

# 1.4.0

* Fixed input filters lost after version update (\#535);
* JSON Schema form: computed default values also for empty object (\#535);
* Supported `prefixItems` of JSON Schema Draft 2020-12 - `pydantic_v2` (\#535);

# 1.3.2

* Supported `pydantic_v2` schemas (\#532);

# 1.3.1

* Fixed custom key not displayed in JSON Schema form (\#529);
* Added dropdown for Python version in tasks (\#526);
* Improved formatting of errors in standard error alert component (\#526);
* Used `postgres-psycopg` adapter in CI (\#525);
* Used `FRACTAL_BACKEND_RUNNER=local_experimental` in CI for v2 tests (\#525);

# 1.3.0

> Starting from this release the Sandbox pages are not included in fractal-web anymore, instead they are static pages published together with the documentation.

* Added Custom Python env task collection (\#523);
* Fixed issue with ajv formats on sandbox (\#522);
* Removed "Clear" button from tuples (\#521);
* Added "Reset" button on top-level properties having a default value (\#521);
* Added task manifest sandbox (\#521);
* Validated invalid text in numeric inputs (\#521);
* Moved JSON Schema components to a separated component (\#518);
* Moved Sandbox pages to a separated component (\#518);

# 1.2.0

* Conditionally included V1 pages (\#514);
* Added task version update sandbox page (\#509);
* JSON Schema form improvements (\#509):
    * supported enums of any type;
    * supported tuples;
    * used grey color for optional properties that are unset;
    * hided default label for fields without title.
* Added docs about JSON Schema Sandbox page (\#509).
* Added maintenance banner when fractal-server is down (\#504).

# 1.1.0

> WARNING: with this release all the environment variables will be read from
> the environment, when the service is started, not during build time. Remember
> to load in your environment all the variables that you need when you start
> the service in production. This will not affect development setup.
> See https://fractal-analytics-platform.github.io/fractal-web/quickstart/ for
> instructions.

* Updated quickstart documenting the changes related to environment variables (\#492).
* Fixed bug in default dataset selection when job references a deleted dataset (\#492).
* Fixed v1 workflow task version update bug (\#492).
* Added `npm pack` artifacts to files published by the CI during the release (\#492).
* Fixed v2 admin job download link (\#492).
* Imported all the environment variables dynamically (\#492).
* Added backend logging using Log4js (\#492).
* Improved JSON Schema Sandbox page (\#490).

# 1.0.4

* Removed users management section from admin area v1 (\#485).
* Included v1/v2 switcher in admin-area job page (\#485).
* Setup tests to use PostgreSQL instead of SQlite (\#484).
* Implemented tasks admin page (\#484).
* Improved form builder used in workflow tasks without JSON Schema and in Meta properties tab (\#481).
* Used collapsible sections in dataset history modal (\#481).

# 1.0.3

* fixed issue in task version update when no arguments fix is needed (\#477).

# 1.0.2

* fixed issue in task version update with optional arguments (\#475).

# 1.0.1

* used payload containing all fields in meta properties PATCH endpoint (\#473).

# 1.0.0

* Supported fractal-server API V2:
    * added menu switch to support legacy and current API (\#434, \#457);
    * Dataset V2 CRUD with attribute and type filters (\#434);
    * new Dataset page with image list and filters (\#434);
    * updated Single Task form to handle parallel and non parallel fields (\#434);
    * updated workflow task form to handle parallel and non parallel arguments (\#434);
    * handled V2 import and export of workflow task arguments (\#434);
    * handled V2 version workflow task version update (\#434);
    * added admin "Tasks V1/V2 compatibility" page (\#450);
    * supported adding V1 task in V2 workflow (\#450);
    * removed read only property from V2 datasets (\#450);
    * added input filters tab in workflow task page (\#452, \#457);
    * added searchable dropdowns for image filters (\#452);
    * moved editing of dataset inside dataset page (\#452);
    * supported editing of single dataset images (\#457);
    * used switches to represent boolean flags (\#457);
    * implemented continue/restart workflow (\#465);
    * set default first task when continuing a workflow (\#466);
    * displayed applied filters in workflow execution modal (\#466);
    * implemented import and export of datasets (\#467);
    * handled selection of default dataset on workflow page (\#467);

# 0.10.2

* Added search functionality on jobs table filters (\#424).

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
