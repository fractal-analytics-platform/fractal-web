import { listUsers } from '$lib/server/api/v1/auth_api.js';
import { listProjects } from '$lib/server/api/v2/admin_api.js';
import { getLogger } from '$lib/server/logger.js';

const logger = getLogger('admin jobs page [v2]');

export async function load({ fetch }) {
	logger.trace('Loading admin jobs page');

	/** @type {import('$lib/types').Project[]} */
	const projects = await listProjects(fetch);

	/** @type {import('$lib/types').User[]} */
	const users = await listUsers(fetch);

	return {
		projects,
		users
	};
}
