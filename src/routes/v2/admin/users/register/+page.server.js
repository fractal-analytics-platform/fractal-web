import { env } from '$env/dynamic/private';
import { getLogger } from '$lib/server/logger.js';

const logger = getLogger('admin create user page');

export async function load() {
	logger.trace('Loading create user page');

	return {
		runnerBackend: env.FRACTAL_RUNNER_BACKEND
	};
}
