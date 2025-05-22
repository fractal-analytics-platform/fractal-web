import { listTaskGroups } from '$lib/server/api/v2/task_api';

export async function load({ fetch }) {
	const taskGroups = await listTaskGroups(fetch, false, true);
	return {
		taskGroups
	};
}
