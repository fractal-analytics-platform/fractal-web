import { getLogger } from '$lib/server/logger.js';
import { env } from '$env/dynamic/private';

const logger = getLogger('server alive API');

/**
 * @param {typeof fetch} fetch
 * @returns {Promise<{ alive: boolean, version: string | null }>}
 */
export async function getServerInfo(fetch) {
	let serverInfo = { alive: false, version: null };

	try {
		const serverInfoResponse = await fetch(env.FRACTAL_SERVER_HOST + '/api/alive/');
		if (serverInfoResponse.ok) {
			serverInfo = await serverInfoResponse.json();
			logger.debug('Server info loaded: Alive %s - %s', serverInfo.alive, serverInfo.version);
		} else {
			logger.error(
				'Alive endpoint replied with unsuccessful status code %d',
				serverInfoResponse.status
			);
		}
	} catch (error) {
		logger.fatal('Error loading server info', error);
	}

	return serverInfo;
}
