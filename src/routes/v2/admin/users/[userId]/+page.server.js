import { FRACTAL_RUNNER_BACKEND, FRACTAL_DEFAULT_GROUP_NAME } from '$app/env/private';
import { getUser, listGroups } from '#lib/server/api/auth_api.js';
import { getProfile } from '#lib/server/api/v2/admin_api.js';
import { getLogger } from '#lib/server/logger.js';

const logger = getLogger('admin user page');

export async function load({ fetch, params }) {
	logger.debug('Loading user %d', params.userId);

	const user = await getUser(fetch, params.userId);
	let profile = undefined;
	if (user.profile_id) {
		profile = await getProfile(fetch, user.profile_id);
	}
	const groups = await listGroups(fetch);

	return {
		user,
		profile,
		groups,
		runnerBackend: FRACTAL_RUNNER_BACKEND,
		defaultGroupName: FRACTAL_DEFAULT_GROUP_NAME ?? null
	};
}
