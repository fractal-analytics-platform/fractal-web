import { getUser } from '$lib/server/api/v1/auth_api';
import { getLogger } from '$lib/server/logger.js';

const logger = getLogger('admin user page');

/** @type {import('./$types').PageServerLoad} */
export async function load({ fetch, params }) {
	logger.debug('Loading user %d', params.userId);

	/** @type {import('$lib/types').User} */
	const user = await getUser(fetch, params.userId);

	return {
		user
	};
}
