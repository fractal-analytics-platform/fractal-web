import { orderTasksByOwnerThenByNameThenByVersion } from '$lib/common/component_utilities';
import { listTasks } from '$lib/server/api/v1/task_api';

export async function load({ fetch }) {
	/** @type {import('$lib/types').Task[]} */
	const tasks = await listTasks(fetch);

	orderTasksByOwnerThenByNameThenByVersion(tasks, null, 'desc');

	return {
		tasks
	};
}
