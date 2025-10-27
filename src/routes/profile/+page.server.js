import { getCurrentUser, getProfileInfo } from '$lib/server/api/auth_api.js';
import { env } from '$env/dynamic/private';
import { getLogger } from '$lib/server/logger.js';

const logger = getLogger('profile page');

export async function load({ fetch }) {
	logger.trace('Load profile page');

	const user = await getCurrentUser(fetch, true);
	const profile = await getProfileInfo(fetch);

	return {
		user,
		profile,
		runnerBackend: env.FRACTAL_RUNNER_BACKEND
	};
}
