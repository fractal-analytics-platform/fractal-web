import { getLogger } from '$lib/server/logger';
import { redirect } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';

const logger = getLogger('v1 pages');

export async function load() {
	if (env.FRACTAL_API_V1_MODE === 'exclude') {
		logger.warn('v1 pages has been disabled, redirecting to home');
		redirect(307, '/');
	}
}
