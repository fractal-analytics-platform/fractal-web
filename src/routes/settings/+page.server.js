import { env } from '$env/dynamic/private';
import { getCurrentUserSettings } from '$lib/server/api/auth_api.js';
import { getLogger } from '$lib/server/logger.js';

const logger = getLogger('settings page');

export async function load({ fetch }) {
	logger.trace('Load settings page');

	const settings = await getCurrentUserSettings(fetch);

	return {
		settings,
		runnerBackend: env.FRACTAL_RUNNER_BACKEND
	};
}
