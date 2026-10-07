import { getCurrentUser } from '#lib/server/api/auth_api.js';
import { listTaskGroups } from '#lib/server/api/v2/task_api.js';
import { getLogger } from '#lib/server/logger.js';
import { FRACTAL_DEFAULT_GROUP_NAME } from '$app/env/private';

const logger = getLogger('tasks management page');

export async function load({ fetch }) {
	logger.trace('Load tasks management page');

	const user =
		/** @type {import('#fractal-components/types/api').User & {group_ids_names: Array<[number, string]>}} */ (
			await getCurrentUser(fetch, true)
		);
	const taskGroups = await listTaskGroups(fetch, false);

	const defaultGroupName = FRACTAL_DEFAULT_GROUP_NAME ?? null;

	return {
		user,
		taskGroups,
		defaultGroupName,
		helpLink: '/reference/task-collection/'
	};
}
