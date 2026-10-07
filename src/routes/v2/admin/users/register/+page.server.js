import { FRACTAL_RUNNER_BACKEND, FRACTAL_DEFAULT_GROUP_NAME } from '$app/env/private';
import { listGroups } from '#lib/server/api/auth_api.js';
import { getLogger } from '#lib/server/logger.js';

const logger = getLogger('admin create user page');

export async function load({ fetch }) {
	logger.trace('Loading create user page');

	const groups = await listGroups(fetch);

	return {
		runnerBackend: FRACTAL_RUNNER_BACKEND,
		defaultGroupName: FRACTAL_DEFAULT_GROUP_NAME ?? null,
		groups
	};
}
