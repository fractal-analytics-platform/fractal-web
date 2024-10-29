import { listGroups, listUsers } from '$lib/server/api/auth_api';
import { getLogger } from '$lib/server/logger.js';

const logger = getLogger('admin task groups page');

export async function load({ fetch }) {
	logger.trace('Load admin task groups page');

	const groups = await listGroups(fetch, false);
	const users = await listUsers(fetch);

	return {
		groups,
		users
	};
}