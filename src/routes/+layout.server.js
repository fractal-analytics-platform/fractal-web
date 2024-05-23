import { FRACTAL_SERVER_HOST } from '$env/static/private';
import { getCurrentUser } from '$lib/server/api/v1/auth_api';
import { getLogger } from '$lib/server/logger.js';

const logger = getLogger('page layout');

export async function load({ fetch, cookies }) {
	// This is a mark to notify and log when the server is running SSR
	logger.debug('SSR - Main layout');

	const serverInfo = await fetch(FRACTAL_SERVER_HOST + '/api/alive/')
		.then(async (res) => {
			const info = await res.json();
			logger.debug('Server info loaded: Alive %s - %s', info.alive, info.version);
			return info;
		})
		.catch((error) => {
			logger.fatal('Error loading server info', error);
		});

	// Check user info
	// Check auth cookie is present
	const fastApiUsersAuth = cookies.get('fastapiusersauth');
	if (!fastApiUsersAuth) {
		logger.debug('No auth cookie found');
		return {
			serverInfo,
			userInfo: null
		};
	}

	const userInfo = await getCurrentUser(fetch).catch((error) => {
		logger.error('Error loading user info', error);
		return null;
	});

	return {
		serverInfo,
		userInfo
	};
}
