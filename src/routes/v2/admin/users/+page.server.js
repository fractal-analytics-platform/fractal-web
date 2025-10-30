import { listUsers } from '$lib/server/api/auth_api';
import { getProfiles } from '$lib/server/api/v2/admin_api.js';
import { getLogger } from '$lib/server/logger.js';

const logger = getLogger('admin users page');

export async function load({ fetch }) {
	logger.trace('Load users page');

	// Load users from server
	const users = await listUsers(fetch);
	const profiles = await getProfiles(fetch);

	return {
		users,
		profiles
	};
}
