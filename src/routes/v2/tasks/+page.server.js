import { removeIdenticalTaskGroups } from '$lib/components/v2/tasks/task_group_utilities';
import { getCurrentUser } from '$lib/server/api/auth_api.js';
import { listTaskGroups } from '$lib/server/api/v2/task_api';

export async function load({ fetch }) {
	const user =
		/** @type {import('$lib/types').User & {group_ids_names: Array<[number, string]>}} */ (
			await getCurrentUser(fetch, true)
		);
	const taskGroups = removeIdenticalTaskGroups(await listTaskGroups(fetch), user);

	return {
		user,
		taskGroups
	};
}
