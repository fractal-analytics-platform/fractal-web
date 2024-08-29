import { env } from '$env/dynamic/private';
import { responseError } from '$lib/common/errors';
import { getLogger } from '$lib/server/logger.js';

const logger = getLogger('settings API');

/**
 * Fetches the settings from the server
 * @param {typeof fetch} fetch
 * @returns {Promise<any>}
 */
export async function listSettings(fetch) {
	logger.debug('Fetching the settings');
	const response = await fetch(env.FRACTAL_SERVER_HOST + '/api/settings/', {
		method: 'GET',
		credentials: 'include'
	});

	if (!response.ok) {
		logger.error('Unable to fetch the settings');
		await responseError(response);
	}

	return await response.json();
}
