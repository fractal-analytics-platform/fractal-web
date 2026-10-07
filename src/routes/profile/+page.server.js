import { getCurrentUser, getProfileInfo } from '#lib/server/api/auth_api.js';
import { FRACTAL_RUNNER_BACKEND } from '$app/env/private';
import { getLogger } from '#lib/server/logger.js';

const logger = getLogger('profile page');

export async function load({ fetch }) {
	logger.trace('Load profile page');

	const user = await getCurrentUser(fetch, true);
	const profile = await getProfileInfo(fetch);

	return { user, profile, runnerBackend: FRACTAL_RUNNER_BACKEND };
}
