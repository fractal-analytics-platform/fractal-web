import { orderTasksByOwnerThenByNameThenByVersion } from '$lib/common/component_utilities';
import { listLegacyTasks } from '$lib/server/api/v2/task_api.js';
import { getLogger } from '$lib/server/logger.js';

const logger = getLogger('admin tasks compatibility page');

export async function load({ fetch }) {
	logger.trace('Loding admin tasks compatibility page');

	const tasks = await listLegacyTasks(fetch);

	orderTasksByOwnerThenByNameThenByVersion(tasks, null, 'desc');

	return {
		tasks
	};
}
