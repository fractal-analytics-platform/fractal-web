import { getLogger } from '$lib/server/logger';
import { redirect } from '@sveltejs/kit';

const logger = getLogger('sandbox');

export async function load() {
	if (import.meta.env.MODE !== 'development') {
		logger.warn('Sandbox page is disabled when mode is not development');
		throw redirect(307, '/');
	}
}
