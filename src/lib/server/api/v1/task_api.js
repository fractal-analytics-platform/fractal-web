import { FRACTAL_SERVER_HOST } from '$env/static/private';
import { responseError } from '$lib/common/errors.js';

/**
 * Fetches a list of tasks from the server
 * @param fetch
 * @returns {Promise<*>}
 */
export async function listTasks(fetch) {
	console.log('Server fetching tasks');

	// Compose request
	const response = await fetch(FRACTAL_SERVER_HOST + '/api/v1/task/', {
		method: 'GET',
		credentials: 'include',
		mode: 'cors'
	});

	if (response.ok) {
		return await response.json();
	}
	await responseError(response);
}
