import { orderTasksByOwnerThenByNameThenByVersion } from '$lib/common/component_utilities';
import { listTasks } from '$lib/server/api/v2/task_api';

export async function load({ fetch }) {
	const tasks = await listTasks(fetch);

	orderTasksByOwnerThenByNameThenByVersion(tasks, null, 'desc');

	return {
		tasks
	};
}
