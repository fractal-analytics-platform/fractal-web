import { getGroup, listUsers } from '$lib/server/api/auth_api';
import { getLogger } from '$lib/server/logger.js';

const logger = getLogger('admin group page');

export async function load({ fetch, params }) {
	logger.debug('Loading group %d', params.groupId);
	const group = await getGroup(fetch, params.groupId);

	logger.trace('Loading users', params.groupId);
	const users = await listUsers(fetch);

	return {
		group,
		users
	};
}
