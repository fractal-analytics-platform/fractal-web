import { sortGroupByNameAllFirstComparator } from '$lib/components/admin/user_utilities.js';
import { listGroups } from '$lib/server/api/auth_api';
import { getLogger } from '$lib/server/logger.js';

const logger = getLogger('admin groups page');

export async function load({ fetch }) {
	logger.trace('Load groups page');

	const groups = await listGroups(fetch, true);

	groups.sort(sortGroupByNameAllFirstComparator);

	return {
		groups
	};
}
