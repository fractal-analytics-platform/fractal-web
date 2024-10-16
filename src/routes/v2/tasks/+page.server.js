import { getCurrentUser } from '$lib/server/api/auth_api.js';
import { listTaskGroups } from '$lib/server/api/v2/task_api';

export async function load({ fetch }) {
	const taskGroups = await listTaskGroups(fetch);
	const user = await getCurrentUser(fetch, true);

	return {
		user,
		taskGroups
	};
}
