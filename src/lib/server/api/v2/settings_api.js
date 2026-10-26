import { FRACTAL_SERVER_HOST } from '$app/env/private';
import { responseError } from '#lib/common/errors.server.js';
import { getLogger } from '#lib/server/logger.js';

const logger = getLogger('settings API');

/**
 * Fetches the settings from the server
 * @param {typeof fetch} fetch
 * @param {string} type
 * @returns {Promise<Record<string, string>>}
 */
export async function listSettings(fetch, type) {
	logger.debug('Fetching the settings');
	const response = await fetch(`${FRACTAL_SERVER_HOST}/api/settings/${type}`);

	if (!response.ok) {
		logger.error('Unable to fetch the settings');
		await responseError(response);
	}

	return await response.json();
}
