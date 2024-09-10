import { getCurrentUser } from '$lib/server/api/auth_api.js';
import { getLogger } from '$lib/server/logger.js';

const logger = getLogger('profile page');

export async function load({ fetch }) {
	logger.trace('Load profile page');

	const user = await getCurrentUser(fetch, true);

	return {
		user
	};
}
