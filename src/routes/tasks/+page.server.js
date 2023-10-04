import { listTasks } from '$lib/server/api/v1/task_api';

export async function load({ fetch }) {
	const tasks = await listTasks(fetch);
	return {
		tasks
	};
}
