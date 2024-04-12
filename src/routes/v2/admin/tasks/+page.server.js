import { listLegacyTasks } from '$lib/server/api/v2/task_api.js';

export async function load({ fetch }) {
	/** @type {import('$lib/types').Task[]} */
	const tasks = await listLegacyTasks(fetch);

	return {
		tasks
	};
}
