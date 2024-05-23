import { listUsers } from '$lib/server/api/v1/auth_api.js';
import { listProjects } from '$lib/server/api/v1/admin_api.js';
import { getLogger } from '$lib/server/logger';

const logger = getLogger('admin jobs page [v1]');

export async function load({ fetch }) {
	logger.trace('Loading admin jobs page');

	const projects = await listProjects(fetch);
	const users = await listUsers(fetch);

	return {
		projects,
		users
	};
}
