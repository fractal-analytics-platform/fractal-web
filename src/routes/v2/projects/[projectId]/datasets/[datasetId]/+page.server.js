import { getDatasetImages } from '$lib/server/api/v2/dataset_api';
import { getDataset } from '$lib/server/api/v2/project_api';
import { getLogger } from '$lib/server/logger.js';

const logger = getLogger('dataset page [v2]');

export async function load({ fetch, params }) {
	logger.trace('Load Dataset Page');

	const { projectId, datasetId } = params;

	const dataset = await getDataset(fetch, projectId, datasetId);

	const imagePage = await getDatasetImages(fetch, projectId, datasetId, 1, 10, {});

	return {
		dataset,
		imagePage
	};
}
