import { FRACTAL_SERVER_HOST } from '$env/static/private';
import { responseError } from '$lib/common/errors';
import { getLogger } from '$lib/server/logger.js';

const logger = getLogger('admin API [v2]');

/**
 * Fetches the list of jobs from the server
 * @param {typeof fetch} fetch
 * @returns {Promise<*>}
 */
export async function getJobs(fetch) {
	logger.debug('Fetching jobs');

	const response = await fetch(FRACTAL_SERVER_HOST + `/admin/v2/job/?log=false`, {
		method: 'GET',
		credentials: 'include'
	});

	if (response.ok) {
		return await response.json();
	}

	logger.error('Unable to fetch the list of jobs');
	await responseError(response);
}

/**
 * Fetches the list of projects from the server
 * @param {typeof fetch} fetch
 * @returns {Promise<*>}
 */
export async function listProjects(fetch) {
	logger.debug('Fetching the list of projects');
	const response = await fetch(FRACTAL_SERVER_HOST + '/admin/v2/project/', {
		method: 'GET',
		credentials: 'include'
	});

	if (response.ok) {
		return await response.json();
	}

	logger.error('Unable to fetch the list of projects');
	await responseError(response);
}
