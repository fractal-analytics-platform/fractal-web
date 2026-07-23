import { listUsers } from '$lib/server/api/auth_api.js';
import { getLogger } from '$lib/server/logger.js';
import { env } from '$env/dynamic/private';

const logger = getLogger('admin jobs page [v2]');

export async function load({ fetch }) {
	logger.trace('Loading admin jobs page');

	const users = await listUsers(fetch);

	return {
		users,
		runnerBackend: env.FRACTAL_RUNNER_BACKEND
	};
}
