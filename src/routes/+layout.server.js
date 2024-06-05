import { getLogger } from '$lib/server/logger.js';

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

	return pageInfo;
}
