import { getDataset } from '$lib/server/api/v2/project_api';

export async function load({ fetch, params }) {
	console.log('Load Dataset Page');

	const { projectId, datasetId } = params;

	const dataset = await getDataset(fetch, projectId, datasetId);

	return {
		dataset
	};
}
