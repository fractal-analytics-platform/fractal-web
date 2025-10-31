import { env } from '$env/dynamic/private';
import { getUser, listGroups } from '$lib/server/api/auth_api';
import { getLogger } from '$lib/server/logger.js';

const logger = getLogger('admin edit user page');

export async function load({ fetch, params }) {
	logger.trace('Loading user %d', params.userId);

	const user = await getUser(fetch, params.userId);
	const groups = await listGroups(fetch);

	return {
		user,
		groups,
		runnerBackend: env.FRACTAL_RUNNER_BACKEND,
		defaultGroupName: env.FRACTAL_DEFAULT_GROUP_NAME ?? null
	};
}
