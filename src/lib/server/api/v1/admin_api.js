import { env } from '$env/dynamic/private';
import { responseError } from '$lib/common/errors';
import { getLogger } from '$lib/server/logger.js';

const logger = getLogger('admin API [v1]');

/**
 * Fetches the list of projects from the server
 * @param {typeof fetch} fetch
 * @returns {Promise<import('$lib/types').Project[]>}
 */
export async function listProjects(fetch) {
	logger.debug('Fetching the list of projects');
	const response = await fetch(env.FRACTAL_SERVER_HOST + '/admin/v1/project/', {
		method: 'GET',
		credentials: 'include'
	});

	if (!response.ok) {
		logger.error('Unable to fetch the list of projects');
		await responseError(response);
	}

	return await response.json();
}
