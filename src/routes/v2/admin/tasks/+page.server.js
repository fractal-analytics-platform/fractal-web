import { listUsers } from '$lib/server/api/auth_api.js';
import { getLogger } from '$lib/server/logger.js';

const logger = getLogger('admin tasks page [v2]');

export async function load({ fetch }) {
	logger.trace('Loading admin tasks page');

	const usersList = await listUsers(fetch);

	const users = /** @type {string[]} */ ([
		...new Set(usersList.map((u) => (u.username ? u.username : u.slurm_user)).filter((u) => !!u))
	]);

	users.sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));

	return {
		users
	};
}
