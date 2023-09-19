import {
	getProject,
	getDataset
} from '$lib/server/api/v1/project_api';

export async function load({ fetch, params }) {
	console.log('Load Dataset Page');

	const { projectId, datasetId } = params;

	const project = await getProject(fetch, projectId);
	const dataset = await getDataset(fetch, projectId, datasetId);

	return {
		dataset,
		project
	};
}
