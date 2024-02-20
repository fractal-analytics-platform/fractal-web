import { FRACTAL_SERVER_HOST } from '$env/static/private';
import { responseError } from '$lib/common/errors';

/**
 * Fetches all the datasets of a user
 * @param {typeof fetch} fetch
 * @returns {Promise<*>}
 */
export async function getUserDatasets(fetch) {
	const response = await fetch(FRACTAL_SERVER_HOST + `/api/v1/dataset/?history=false`, {
		method: 'GET',
		credentials: 'include'
	});

	if (response.ok) {
		return await response.json();
	}

	await responseError(response);
}
