import { env } from '$env/dynamic/private';
import { responseError } from '$lib/common/errors';
import { getLogger } from '$lib/server/logger.js';

const logger = getLogger('admin API [v2]');

/**
 * Fetches the list of projects from the server
 * @param {typeof fetch} fetch
 * @returns {Promise<import('fractal-components/types/api').ProjectV2[]>}
 */
export async function listProjects(fetch) {
	logger.debug('Fetching the list of projects');
	const response = await fetch(`${env.FRACTAL_SERVER_HOST}/admin/v2/project/`, {
		method: 'GET',
		credentials: 'include'
	});

	if (!response.ok) {
		logger.error('Unable to fetch the list of projects');
		await responseError(response);
	}

	return await response.json();
}

/**
 * Request to impersonate user
 * @param {typeof fetch} fetch
 * @param {number} userId
 * @returns {Promise<{ access_token: string }>}
 */
export async function userImpersonation(fetch, userId) {
	logger.debug(`Impersonating user ${userId}`);
	const response = await fetch(`${env.FRACTAL_SERVER_HOST}/admin/v2/impersonate/${userId}/`, {
		method: 'GET',
		credentials: 'include'
	});

	if (!response.ok) {
		logger.warn('Impersonation failed');
		await responseError(response);
	}

	return await response.json();
}
