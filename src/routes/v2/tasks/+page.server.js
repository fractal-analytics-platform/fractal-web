import { listTaskGroups } from '#lib/server/api/v2/task_api.js';
import { FRACTAL_DISPLAY_CORE_TASK_FILTER } from '$app/env/private';

export async function load({ fetch }) {
	const taskGroups = await listTaskGroups(fetch, true);
	return {
		taskGroups,
		showOnlyCoreFiltering: FRACTAL_DISPLAY_CORE_TASK_FILTER
	};
}
