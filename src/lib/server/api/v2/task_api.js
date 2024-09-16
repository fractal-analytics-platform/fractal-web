import { env } from '$env/dynamic/private';
import { responseError } from '$lib/common/errors.js';
import { getLogger } from '$lib/server/logger.js';

const logger = getLogger('task API [v2]');

/**
 * Fetches a list of tasks from the server
 * @param {typeof fetch} fetch
 * @returns {Promise<Array<import('$lib/types-v2').TaskV2>>}
 */
export async function listTasks(fetch) {
	logger.debug('Fetching tasks');

	// Compose request
	const response = await fetch(
		env.FRACTAL_SERVER_HOST + '/api/v2/task/?args_schema_non_parallel=false&args_schema_parallel=false',
		{
			method: 'GET',
			credentials: 'include',
			mode: 'cors'
		}
	);

	if (!response.ok) {
		logger.error('Unable to fetch tasks');
		await responseError(response);
	}

	return await response.json();
}
