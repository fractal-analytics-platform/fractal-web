import { env } from '$env/dynamic/private';
import { responseError } from '$lib/common/errors';
import { getLogger } from '$lib/server/logger.js';

const logger = getLogger('dataset API [v2]');

/**
 * Fetches project's dataset images from the server
 * @param {typeof fetch} fetch
 * @param {number|string} projectId
 * @param {number|string} datasetId
 * @param {number} page
 * @param {number} pageSize
 * @param {object} params
 * @returns {Promise<import('fractal-components/types/api').ImagePage>}
 */
export async function getDatasetImages(fetch, projectId, datasetId, page, pageSize, params) {
	logger.debug(
		`Fetching the list of dataset images [dataset_id=${datasetId}] [project_id=${projectId}] [page=${page}] [page_size=${pageSize}]`
	);
	const headers = new Headers();
	headers.set('Content-Type', 'application/json');

	const response = await fetch(
		env.FRACTAL_SERVER_HOST +
			`/api/v2/project/${projectId}/dataset/${datasetId}/images/query/?page=${page}&page_size=${pageSize}`,
		{
			method: 'POST',
			headers,
			credentials: 'include',
			body: JSON.stringify(params)
		}
	);

	if (!response.ok) {
		logger.error(
			`Unable to fetch the list of dataset images [dataset_id=${datasetId}] [project_id=${projectId}] [page=${page}] [page_size=${pageSize}]`
		);
		await responseError(response);
	}

	return await response.json();
}
