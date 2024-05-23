import { getUser } from '$lib/server/api/v1/auth_api';
import { getLogger } from '$lib/server/logger.js';

const logger = getLogger('admin edit user page');

export async function load({ fetch, params }) {
	logger.trace('Loading user %d', params.userId);

	const user = await getUser(fetch, params.userId);

	return {
		user
	};
}
