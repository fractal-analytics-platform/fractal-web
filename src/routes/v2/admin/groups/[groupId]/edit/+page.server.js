import { getGroup, listUsers } from '#lib/server/api/auth_api.js';
import { getLogger } from '#lib/server/logger.js';
import { FRACTAL_DEFAULT_GROUP_NAME } from '$app/env/private';

const logger = getLogger('admin group editing page');

export async function load({ fetch, params }) {
	logger.trace('Loading group %d', params.groupId);
	const group = await getGroup(fetch, params.groupId);

	const defaultGroupName = FRACTAL_DEFAULT_GROUP_NAME ?? null;

	logger.trace('Loading users', params.groupId);
	const users = await listUsers(fetch);

	return {
		group,
		defaultGroupName,
		users
	};
}
