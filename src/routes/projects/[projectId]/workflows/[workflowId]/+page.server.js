import { getWorkflow } from '$lib/server/api/v1/workflow_api';
import { getProject } from '$lib/server/api/v1/project_api';

export async function load({ fetch, params }) {
	console.log('Load workflow page');

	const { projectId, workflowId } = params;

	// Get the project
	const project = await getProject(fetch, projectId);

	// Get the workflow
	const workflow = await getWorkflow(fetch, projectId, workflowId);

	// Get available tasks
	const datasets = project ? project.dataset_list : [];

	return {
		project,
		workflow,
		datasets
	};
}
