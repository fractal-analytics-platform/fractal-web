import { listTaskGroups } from '$lib/server/api/v2/task_api';
import { env } from '$env/dynamic/private';

export async function load({ fetch }) {
	const showOnlyCoreFiltering = env.FRACTAL_DISPLAY_CORE_TASK_FILTER;
	const taskGroups = await listTaskGroups(fetch, true, true);
	return {
		taskGroups,
		showOnlyCoreFiltering
	};
}
