import { listSettings } from '$lib/server/api/v2/settings_api';
import { getLogger } from '$lib/server/logger.js';

const logger = getLogger('admin settings page');

export async function load({ fetch }) {
	logger.trace('Loading settings page');

	const appSettings = await listSettings(fetch, 'app');
	const databaseSettings = await listSettings(fetch, 'database');
	const emailSettings = await listSettings(fetch, 'email');

	return {
		appSettings,
		databaseSettings,
		emailSettings
	};
}
