import { getCurrentUser } from '$lib/server/api/auth_api.js';
import { listTaskGroups } from '$lib/server/api/v2/task_api';
import { getLogger } from '$lib/server/logger';
import { env } from '$env/dynamic/private';

const logger = getLogger('tasks management page');

export async function load({ fetch }) {
	logger.trace('Load tasks management page');

	const user =
		/** @type {import('fractal-components/types/api').User & {group_ids_names: Array<[number, string]>}} */ (
			await getCurrentUser(fetch, true)
		);
	const taskGroups = await listTaskGroups(fetch);

	const defaultGroupName = env.FRACTAL_DEFAULT_GROUP_NAME ?? null;

	return {
		user,
		taskGroups,
		defaultGroupName
	};
}
