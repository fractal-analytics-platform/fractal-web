import { listUsers } from '#lib/server/api/auth_api.js';
import { getLogger } from '#lib/server/logger.js';

const logger = getLogger('impersonate user page');

export async function load({ fetch }) {
	logger.trace('Loading impersonate user page');

	const users = await listUsers(fetch);

	return {
		users
	};
}
