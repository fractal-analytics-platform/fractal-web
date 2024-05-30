import { env } from '$env/dynamic/private';
import { error } from '@sveltejs/kit';
import { getLogger } from '$lib/server/logger.js';

const logger = getLogger('hooks');

export async function handle({ event, resolve }) {
	logger.info('[%s] - %s', event.request.method, event.url.pathname);

	if (
		event.url.pathname == '/' ||
		event.url.pathname.startsWith('/auth') ||
		event.url.pathname.startsWith('/sandbox/jsonschema')
	) {
		logger.debug('Public page - No auth required');
		return await resolve(event);
	}

	if (event.url.pathname.startsWith('/api')) {
		// API page - AJAX request - handled in proxy'
		return await resolve(event);
	}

	// Authentication guard
	const fastApiUsersAuth = event.cookies.get('fastapiusersauth');
	if (!fastApiUsersAuth) {
		logger.debug('Authentication required - No auth cookie found - Redirecting to login');
		return new Response(null, {
			status: 302,
			headers: { location: '/auth/login?invalidate=true' }
		});
	}

	const currentUser = await event.fetch(`${env.FRACTAL_SERVER_HOST}/auth/current-user/`);
	if (!currentUser.ok) {
		logger.debug('Validation of authentication - Error loading user info');
		return new Response(null, {
			status: 302,
			headers: { location: '/auth/login?invalidate=true' }
		});
	}

	if (event.url.pathname.startsWith('/v1/admin') || event.url.pathname.startsWith('/v2/admin')) {
		const user = await currentUser.json();
		if (!user.is_superuser) {
			throw error(403, `Only superusers can access the admin area`);
		}
	}

	return await resolve(event);
}

/** @type {import('@sveltejs/kit').HandleFetch} */
export async function handleFetch({ event, request, fetch }) {
	/*
	See:
	1. https://github.com/fractal-analytics-platform/fractal-web/issues/274
	2. https://kit.svelte.dev/docs/hooks#server-hooks-handlefetch
	*/

	if (env.FRACTAL_SERVER_HOST.endsWith('/')) {
		env.FRACTAL_SERVER_HOST = env.FRACTAL_SERVER_HOST.substring(0, env.FRACTAL_SERVER_HOST.length - 1);
	}

	if (request.url.startsWith(env.FRACTAL_SERVER_HOST)) {
		logger.trace('Including cookie into request to %s, via handleFetch', request.url);
		const cookie = event.request.headers.get('cookie');
		if (cookie) {
			request.headers.set('cookie', cookie);
		}
	}
	return fetch(request);
}
