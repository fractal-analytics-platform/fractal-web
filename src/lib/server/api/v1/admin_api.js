import { FRACTAL_SERVER_HOST } from '$env/static/private';
import { responseError } from '$lib/common/errors';

/**
 * Fetches the list of jobs from the server
 * @param {typeof fetch} fetch
 * @returns {Promise<*>}
 */
export async function getJobs(fetch) {
	console.log('Fetching job from server');

	const response = await fetch(FRACTAL_SERVER_HOST + `/admin/job`, {
		method: 'GET',
		credentials: 'include'
	});

	if (response.ok) {
		return await response.json();
	}

	await responseError(response);
}
