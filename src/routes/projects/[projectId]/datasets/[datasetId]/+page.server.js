import { loadForVersion } from '$lib/common/selected_api_version';
import { getDataset as getDatasetV1 } from '$lib/server/api/v1/project_api';
import { getDataset as getDatasetV2 } from '$lib/server/api/v2/project_api';

export async function load({ fetch, params, cookies }) {
	console.log('Load Dataset Page');

	const { projectId, datasetId } = params;

	const getDataset = loadForVersion(cookies, getDatasetV1, getDatasetV2);

	const dataset = await getDataset(fetch, projectId, datasetId);

	return {
		dataset
	};
}
