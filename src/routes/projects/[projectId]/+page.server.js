import { loadForVersion } from '$lib/common/selected_api_version';
import {
	getProject as getProjectV1,
	getProjectDatasets as getProjectDatasetsV1,
	getWorkflows as getWorkflowsV1
} from '$lib/server/api/v1/project_api';
import {
	getProject as getProjectV2,
	getProjectDatasets as getProjectDatasetsV2,
	getWorkflows as getWorkflowsV2
} from '$lib/server/api/v2/project_api';

export async function load({ fetch, params, cookies }) {
	console.log('Load project page');

	const getProject = loadForVersion(cookies, getProjectV1, getProjectV2);
	const getProjectDatasets = loadForVersion(cookies, getProjectDatasetsV1, getProjectDatasetsV2);
	const getWorkflows = loadForVersion(cookies, getWorkflowsV1, getWorkflowsV2);

	// Load project from Server
	const project = await getProject(fetch, params.projectId);

	const datasets = await getProjectDatasets(fetch, params.projectId);
	const workflows = await getWorkflows(fetch, params.projectId);

	return {
		project,
		datasets,
		workflows
	};
}
