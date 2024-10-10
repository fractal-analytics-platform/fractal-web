import { orderTasksByGroupThenByNameThenByVersion } from '$lib/common/component_utilities';
import { getCurrentUser } from '$lib/server/api/auth_api.js';
import { listTasks } from '$lib/server/api/v2/task_api';

export async function load({ fetch }) {
	const tasks = await listTasks(fetch);
	const user = await getCurrentUser(fetch, true);

	orderTasksByGroupThenByNameThenByVersion(tasks, 'desc');

	return {
		user,
		tasks
	};
}
