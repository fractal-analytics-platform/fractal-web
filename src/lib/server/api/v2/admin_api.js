import { env } from '$env/dynamic/private';
import { responseError } from '$lib/common/errors';
import { getLogger } from '$lib/server/logger.js';

const logger = getLogger('admin API [v2]');

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
