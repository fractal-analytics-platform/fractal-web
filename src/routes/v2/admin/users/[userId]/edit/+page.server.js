import { FRACTAL_RUNNER_BACKEND, FRACTAL_DEFAULT_GROUP_NAME } from '$app/env/private';
import { getUser, listGroups } from '#lib/server/api/auth_api.js';
import { getLogger } from '#lib/server/logger.js';

const logger = getLogger('admin edit user page');

export async function load({ fetch, params }) {
	logger.trace('Loading user %d', params.userId);

	const user = await getUser(fetch, params.userId);
	const groups = await listGroups(fetch);

	return {
		user,
		groups,
		runnerBackend: FRACTAL_RUNNER_BACKEND,
		defaultGroupName: FRACTAL_DEFAULT_GROUP_NAME ?? null
	};
}
