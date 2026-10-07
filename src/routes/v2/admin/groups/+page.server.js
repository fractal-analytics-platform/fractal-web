import { getSortGroupByNameAllFirstComparator } from '#lib/components/admin/user_utilities.js';
import { listGroups } from '#lib/server/api/auth_api.js';
import { getLogger } from '#lib/server/logger.js';
import { FRACTAL_DEFAULT_GROUP_NAME } from '$app/env/private';

const logger = getLogger('admin groups page');

export async function load({ fetch }) {
	logger.trace('Load groups page');

	const defaultGroupName = FRACTAL_DEFAULT_GROUP_NAME ?? null;

	const groups = await listGroups(fetch, true);
	groups.sort(getSortGroupByNameAllFirstComparator(defaultGroupName));

	return {
		groups,
		defaultGroupName
	};
}
