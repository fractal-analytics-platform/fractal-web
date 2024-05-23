import { listUsers } from '$lib/server/api/v1/auth_api.js';
import { getLogger } from '$lib/server/logger.js';

const logger = getLogger('admin tasks page [v2]');

export async function load({ fetch }) {
	logger.trace('Loading admin tasks page');

	/** @type {import('$lib/types').User[]} */
	const usersList = await listUsers(fetch);

	const users = /** @type {string[]} */ (
		usersList.map((u) => (u.username ? u.username : u.slurm_user)).filter((u) => !!u)
	);

	users.sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));

	return {
		users
	};
}
