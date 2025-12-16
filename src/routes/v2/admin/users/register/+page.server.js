import { env } from '$env/dynamic/private';
import { listGroups } from '$lib/server/api/auth_api';
import { getLogger } from '$lib/server/logger.js';

const logger = getLogger('admin create user page');

export async function load({ fetch }) {
	logger.trace('Loading create user page');

	const groups = await listGroups(fetch);

	return {
		runnerBackend: env.FRACTAL_RUNNER_BACKEND,
		defaultGroupName: env.FRACTAL_DEFAULT_GROUP_NAME ?? null,
		groups
	};
}
