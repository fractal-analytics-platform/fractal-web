import { listUsers } from '$lib/server/api/auth_api';
import { getLogger } from '$lib/server/logger.js';

const logger = getLogger('admin projects sharing page');

export async function load({ fetch }) {
	logger.trace('Load admin projects sharing page');

	const users = await listUsers(fetch);

	return {
		users
	};
}
