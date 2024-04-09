import { getWorkflow } from '$lib/server/api/v2/workflow_api';
import { getProjectDatasets } from '$lib/server/api/v2/project_api';

export async function load({ fetch, params }) {
	console.log('Load workflow page');

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
