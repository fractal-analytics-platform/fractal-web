import { listTasks } from '$lib/server/api/v1/task_api.js';

export async function load({ fetch }) {
	/** @type {import('$lib/types').Task[]} */
	const tasks = await listTasks(fetch);

	return {
		tasks
	};
}
