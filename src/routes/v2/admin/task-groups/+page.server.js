import { sortUserByEmailComparator } from '$lib/common/user_utilities.js';
import { getSortGroupByNameAllFirstComparator } from '$lib/components/admin/user_utilities.js';
import { listGroups, listUsers } from '$lib/server/api/auth_api';
import { getResources } from '$lib/server/api/v2/admin_api.js';
import { getLogger } from '$lib/server/logger.js';
import { env } from '$env/dynamic/private';

const logger = getLogger('admin task-groups page');

export async function load({ fetch }) {
	logger.trace('Load admin task-groups page');

	const groups = await listGroups(fetch, false);
	const users = await listUsers(fetch);
	const resources = await getResources(fetch);

	const defaultGroupName = env.FRACTAL_DEFAULT_GROUP_NAME ?? null;

	return {
		groups: groups.sort(getSortGroupByNameAllFirstComparator(defaultGroupName)),
		users: users.sort(sortUserByEmailComparator),
		defaultGroupName,
		resources
	};
}
