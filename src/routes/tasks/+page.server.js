import { orderTasksByOwnerThenByNameThenByVersion } from '$lib/common/component_utilities';
import { loadForVersion } from '$lib/common/selected_api_version';
import { listTasks as listTasksV1 } from '$lib/server/api/v1/task_api';
import { listTasks as listTasksV2 } from '$lib/server/api/v2/task_api';

export async function load({ fetch, cookies }) {

	const listTasks = loadForVersion(cookies, listTasksV1, listTasksV2);

	/** @type {import('$lib/types').Task[]} */
	const tasks = await listTasks(fetch);

	orderTasksByOwnerThenByNameThenByVersion(tasks, null, 'desc');

	return {
		tasks
	};
}
