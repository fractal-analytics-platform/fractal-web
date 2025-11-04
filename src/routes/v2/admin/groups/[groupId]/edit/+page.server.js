import { getGroup, listUsers } from '$lib/server/api/auth_api';
import { getLogger } from '$lib/server/logger.js';
import { env } from '$env/dynamic/private';

const logger = getLogger('admin group editing page');

export async function load({ fetch, params }) {
	logger.trace('Loading group %d', params.groupId);
	const group = await getGroup(fetch, params.groupId);

	const defaultGroupName = env.FRACTAL_DEFAULT_GROUP_NAME ?? null;

	logger.trace('Loading users', params.groupId);
	const users = await listUsers(fetch);

	return {
		group,
		defaultGroupName,
		users
	};
}
