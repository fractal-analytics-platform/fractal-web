import { listUsers } from '$lib/server/api/auth_api';
import { getLogger } from '$lib/server/logger.js';

const logger = getLogger('admin users page');

export async function load({ fetch }) {
	logger.trace('Load users page');

	// Load users from server
	const users = await listUsers(fetch);

	return {
		users
	};
}
