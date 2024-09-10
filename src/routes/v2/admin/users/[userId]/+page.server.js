import { getUser } from '$lib/server/api/auth_api';
import { getLogger } from '$lib/server/logger.js';

const logger = getLogger('admin user page');

export async function load({ fetch, params }) {
	logger.debug('Loading user %d', params.userId);

	const user = await getUser(fetch, params.userId);

	return {
		user
	};
}
