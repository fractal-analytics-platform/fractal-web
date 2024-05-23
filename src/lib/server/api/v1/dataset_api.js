import { FRACTAL_SERVER_HOST } from '$env/static/private';
import { responseError } from '$lib/common/errors';
import { getLogger } from '$lib/server/logger.js';

const logger = getLogger('dataset API [v1]');

/**
 * Fetches all the datasets of a user
 * @param {typeof fetch} fetch
 * @returns {Promise<*>}
 */
export async function getUserDatasets(fetch) {
	logger.debug('Fetching the list of the user datasets from the server');
	const response = await fetch(FRACTAL_SERVER_HOST + `/api/v1/dataset/?history=false`, {
		method: 'GET',
		credentials: 'include'
	});

	if (response.ok) {
		return await response.json();
	}

	logger.error('Unable to fetch the list of user datasets from the server');
	await responseError(response);
}
