import { getDataset } from '$lib/server/api/v1/project_api';
import { getLogger } from '$lib/server/logger.js';

const logger = getLogger('dataset page [v1]');

export async function load({ fetch, params }) {
	logger.trace('Load Dataset Page');

	const { projectId, datasetId } = params;

	const dataset = await getDataset(fetch, projectId, datasetId);

	return {
		dataset
	};
}
