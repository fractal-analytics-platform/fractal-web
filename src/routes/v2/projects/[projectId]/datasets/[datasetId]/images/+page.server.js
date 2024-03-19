import { getDatasetImages } from '$lib/server/api/v2/dataset_api.js';
import { getDataset } from '$lib/server/api/v2/project_api.js';

export async function load({ fetch, params }) {
	console.log('Load Dataset Images Page');

	const { projectId, datasetId } = params;

	const dataset = await getDataset(fetch, projectId, datasetId);

	const imagePage = await getDatasetImages(fetch, projectId, datasetId, 1, 10, {});

	return {
		dataset,
		imagePage
	};
}
