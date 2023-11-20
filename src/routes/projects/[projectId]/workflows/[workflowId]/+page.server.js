import { getWorkflow } from '$lib/server/api/v1/workflow_api';
import { getProject, getProjectDatasets } from '$lib/server/api/v1/project_api';

export async function load({ fetch, params }) {
	console.log('Load workflow page');

	const { projectId, workflowId } = params;

	// Get the project
	const project = await getProject(fetch, projectId);

	// Get the workflow
	const workflow = await getWorkflow(fetch, projectId, workflowId);

	// Get the datasets
	const datasets = await getProjectDatasets(fetch, projectId);

	return {
		project,
		workflow,
		datasets
	};
}
