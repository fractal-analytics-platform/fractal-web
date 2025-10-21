import { getProfileUsers } from '$lib/server/api/auth_api';
import { getProfile, getResource } from '$lib/server/api/v2/admin_api';
import { getLogger } from '$lib/server/logger.js';

const logger = getLogger('admin view profile page');

export async function load({ fetch, params }) {
	const resourceId = Number(params.resourceId);
	const profileId = Number(params.profileId);

	logger.debug('Loading resource %d', resourceId);
	const resource = await getResource(fetch, resourceId);
	logger.debug('Loading profile %d', profileId);
	const profile = await getProfile(fetch, profileId);
	const users = await getProfileUsers(fetch, profileId);
	return {
		resource,
		profile,
		users
	};
}
