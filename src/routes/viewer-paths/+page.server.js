import { getCurrentUserViewerPaths } from '$lib/server/api/auth_api.js';
import { getLogger } from '$lib/server/logger.js';

const logger = getLogger('viewer paths page');

export async function load({ fetch }) {
	logger.trace('Load viewer paths page');

	const viewerPaths = await getCurrentUserViewerPaths(fetch);

	return {
		viewerPaths
	};
}
