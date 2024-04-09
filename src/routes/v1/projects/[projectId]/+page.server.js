import { getProject, getProjectDatasets, getWorkflows } from '$lib/server/api/v1/project_api';

export async function load({ fetch, params }) {
	console.log('Load project page');

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
