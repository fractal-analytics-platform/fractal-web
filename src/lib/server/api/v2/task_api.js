import { env } from '$env/dynamic/private';
import { responseError } from '$lib/common/errors.server';
import { getLogger } from '$lib/server/logger.js';

const logger = getLogger('task API [v2]');

/**
 * Fetches a list of task groups from the server
 * @param {typeof fetch} fetch
 * @param {boolean|false=} loadArgsSchema
 * @param {boolean|false=} onlyActive
 * @returns {Promise<Array<[ string, Array<import('fractal-components/types/api').TaskGroupV2> ]>>}
 */
export async function listTaskGroups(fetch, loadArgsSchema = false, onlyActive = false) {
	logger.debug('Fetching task groups');

	const response = await fetch(
		`${env.FRACTAL_SERVER_HOST}/api/v2/task-group/?args_schema=${loadArgsSchema}&only_active=${onlyActive}`,
		{
			method: 'GET',
			credentials: 'include'
		}
	);

	if (!response.ok) {
		logger.error('Unable to fetch task groups');
		await responseError(response);
	}

	return await response.json();
}
