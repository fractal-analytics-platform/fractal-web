import { sortGroupByNameComparator } from '$lib/common/user_utilities';
import { listGroups } from '$lib/server/api/auth_api';
import { getLogger } from '$lib/server/logger.js';

const logger = getLogger('admin groups page');

export async function load({ fetch }) {
	logger.trace('Load groups page');

	const groups = await listGroups(fetch, true);

	groups.sort(sortGroupByNameComparator);

	return {
		groups
	};
}
