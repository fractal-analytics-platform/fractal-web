import { FRACTAL_SERVER_HOST } from '$env/static/private';
import { responseError } from '$lib/common/errors';

/**
 * Fetches all the datasets of a user
 * @param {typeof fetch} fetch
 * @returns {Promise<*>}
 */
export async function getUserDatasets(fetch) {
	const response = await fetch(FRACTAL_SERVER_HOST + `/api/v2/dataset/?history=false`, {
		method: 'GET',
		credentials: 'include'
	});

	if (response.ok) {
		return await response.json();
	}

	await responseError(response);
}

/**
 * Fetches project's dataset images from the server
 * @param {typeof fetch} fetch
 * @param {number|string} projectId
 * @param {number|string} datasetId
 * @param {number} page
 * @param {number} pageSize
 * @param {object} params
 * @returns {Promise<import('$lib/types-v2').ImagePage>}
 */
export async function getDatasetImages(fetch, projectId, datasetId, page, pageSize, params) {
	const headers = new Headers();
	headers.set('Content-Type', 'application/json');

	const response = await fetch(
		FRACTAL_SERVER_HOST +
			`/api/v2/project/${projectId}/dataset/${datasetId}/images/query/?page=${page}&page_size=${pageSize}`,
		{
			method: 'POST',
			headers,
			credentials: 'include',
			body: JSON.stringify(params)
		}
	);

	if (!response.ok) {
		await responseError(response);
	}

	return await response.json();
}
