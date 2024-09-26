import { env } from '$env/dynamic/private';
import { getUser, getUserSettings, listGroups } from '$lib/server/api/auth_api';
import { getLogger } from '$lib/server/logger.js';

const logger = getLogger('admin user page');

export async function load({ fetch, params }) {
	logger.debug('Loading user %d', params.userId);

	const user = await getUser(fetch, params.userId);
	const settings = await getUserSettings(fetch, params.userId);
	const groups = await listGroups(fetch);

	return {
		user,
		settings,
		groups,
		runnerBackend: env.FRACTAL_RUNNER_BACKEND
	};
}
