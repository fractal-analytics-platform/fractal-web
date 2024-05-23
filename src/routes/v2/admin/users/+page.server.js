import { listUsers } from '$lib/server/api/v1/auth_api';
import { getLogger } from '$lib/server/logger.js';

const logger = getLogger('admin users page');

/** @type {import('./$types').PageServerLoad} */
export async function load({ fetch }) {
	logger.trace('Load users page');

	// Load users from server
	const users = await listUsers(fetch);

	return {
		users
	};
}
