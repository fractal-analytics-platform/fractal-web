import { getWorkflow } from '$lib/server/api/v1/workflow_api';
import { getProjectDatasets } from '$lib/server/api/v1/project_api';
import { getLogger } from '$lib/server/logger.js';

const logger = getLogger('workflow page [v1]');

export async function load({ fetch, params }) {
	logger.trace('Load workflow page');

	const { projectId, workflowId } = params;

	// Get the workflow
	const workflow = await getWorkflow(fetch, projectId, workflowId);

	// Get the datasets
	const datasets = await getProjectDatasets(fetch, projectId);

	return {
		workflow,
		datasets
	};
}
