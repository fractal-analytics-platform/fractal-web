import { listUsers } from '$lib/server/api/auth_api.js';
import { getLogger } from '$lib/server/logger.js';

const logger = getLogger('admin jobs page [v2]');

export async function load({ fetch }) {
	logger.trace('Loading admin jobs page');

	const users = await listUsers(fetch);

	return {
		users
	};
}
