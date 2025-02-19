import { removeIdenticalTaskGroups } from 'fractal-components/tasks/task_group_utilities';
import { getCurrentUser } from '$lib/server/api/auth_api.js';
import { listTaskGroups } from '$lib/server/api/v2/task_api';

export async function load({ fetch }) {
	const user =
		/** @type {import('fractal-components/types/api').User & {group_ids_names: Array<[number, string]>}} */ (
			await getCurrentUser(fetch, true)
		);
	const taskGroups = removeIdenticalTaskGroups(await listTaskGroups(fetch, false, true), user);

	return {
		user,
		taskGroups
	};
}
