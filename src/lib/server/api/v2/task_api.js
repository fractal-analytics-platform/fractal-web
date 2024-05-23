import { FRACTAL_SERVER_HOST } from '$env/static/private';
import { responseError } from '$lib/common/errors.js';
import { getLogger } from '$lib/server/logger.js';

const logger = getLogger('task API [v2]');

/**
 * Fetches a list of tasks from the server
 * @param {typeof fetch} fetch
 * @returns {Promise<*>}
 */
export async function listTasks(fetch) {
	logger.debug('Fetching tasks');

	// Compose request
	const response = await fetch(
		FRACTAL_SERVER_HOST + '/api/v2/task/?args_schema_non_parallel=false&args_schema_parallel=false',
		{
			method: 'GET',
			credentials: 'include',
			mode: 'cors'
		}
	);

	if (response.ok) {
		return await response.json();
	}
	logger.error('Unable to fetch tasks');
	await responseError(response);
}

/**
 * Fetches a list of legacy tasks from the server
 * @param {typeof fetch} fetch
 * @returns {Promise<*>}
 */
export async function listLegacyTasks(fetch) {
	logger.debug('Fetching legacy tasks');

	// Compose request
	const response = await fetch(FRACTAL_SERVER_HOST + '/api/v2/task-legacy/?args_schema=false', {
		method: 'GET',
		credentials: 'include',
		mode: 'cors'
	});

	if (response.ok) {
		return await response.json();
	}
	logger.error('Unable to fetch legacy tasks');
	await responseError(response);
}
