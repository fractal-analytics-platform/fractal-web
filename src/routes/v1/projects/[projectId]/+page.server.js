import { getProject, getProjectDatasets } from '$lib/server/api/v1/project_api';
import { getWorkflows } from '$lib/server/api/v1/workflow_api';
import { getLogger } from '$lib/server/logger.js';

const logger = getLogger('project page [v1]');

export async function load({ fetch, params }) {
	logger.trace('Load project page');

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
