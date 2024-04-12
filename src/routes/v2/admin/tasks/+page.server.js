import { orderTasksByOwnerThenByNameThenByVersion } from '$lib/common/component_utilities';
import { listLegacyTasks } from '$lib/server/api/v2/task_api.js';

export async function load({ fetch }) {
	/** @type {import('$lib/types').Task[]} */
	const tasks = await listLegacyTasks(fetch);

	orderTasksByOwnerThenByNameThenByVersion(tasks, null, 'desc');

	return {
		tasks
	};
}
