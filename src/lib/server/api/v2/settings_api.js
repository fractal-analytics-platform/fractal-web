import { env } from '$env/dynamic/private';
import { responseError } from '$lib/common/errors';
import { getLogger } from '$lib/server/logger.js';

const logger = getLogger('settings API');

/**
 * Fetches the settings from the server
 * @param {typeof fetch} fetch
 * @param {string} type
 * @returns {Promise<Record<string, string>>}
 */
export async function listSettings(fetch, type) {
	logger.debug('Fetching the settings');
	const response = await fetch(`${env.FRACTAL_SERVER_HOST}/api/settings/${type}`, {
		method: 'GET',
		credentials: 'include'
	});

	if (!response.ok) {
		logger.error('Unable to fetch the settings');
		await responseError(response);
	}

	return await response.json();
}
