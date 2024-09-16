import { env } from '$env/dynamic/private';
import { getLogger } from '$lib/server/logger.js';
import fs from 'fs/promises';

const logger = getLogger('page layout');

export async function load({ locals, request, url }) {
	// This is a mark to notify and log when the server is running SSR
	logger.debug('SSR - Main layout');

	logger.trace('[%s] - %s', request.method, url.pathname);

	// read pageInfo set from hooks.server.js
	const pageInfo = locals['pageInfo'];

	if (!pageInfo) {
		logger.error('pageInfo is missing, it should have been loaded by hooks.server.js');
	}

	const warningBanner = await getWarningBanner();

	return {
		...pageInfo,
		warningBanner,
		v1Enabled: env.FRACTAL_API_V1_MODE !== 'exclude'
	};
}

async function getWarningBanner() {
	if (!env.WARNING_BANNER_PATH) {
		return null;
	}
	try {
		const bannerData = await fs.readFile(env.WARNING_BANNER_PATH, { encoding: 'utf-8' });
		return bannerData.trim();
	} catch (err) {
		logger.error('An error happened reading warning banner file %s', env.WARNING_BANNER_PATH, err);
		return null;
	}
}
