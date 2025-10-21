import { getResource } from '$lib/server/api/v2/admin_api';
import { getLogger } from '$lib/server/logger.js';

const logger = getLogger('admin resource page');

export async function load({ fetch, params }) {
	logger.debug('Loading resource %d', params.resourceId);
	const resource = await getResource(fetch, Number(params.resourceId));
	return {
		resource
	};
}
