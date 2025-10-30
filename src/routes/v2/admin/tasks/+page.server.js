import { getResources } from '$lib/server/api/v2/admin_api.js';
import { getLogger } from '$lib/server/logger.js';

const logger = getLogger('admin tasks page');

export async function load({ fetch }) {
	logger.trace('Load admin tasks page');

	const resources = await getResources(fetch);

	return {
		resources
	};
}
