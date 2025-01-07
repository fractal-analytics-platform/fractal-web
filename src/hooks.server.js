import { env } from '$env/dynamic/private';
import { getServerInfo } from '$lib/server/api/alive';
import { getCurrentUser } from '$lib/server/api/auth_api';
import { getLogger } from '$lib/server/logger.js';
import { error, redirect } from '@sveltejs/kit';

const logger = getLogger('hooks');

if (!env.FRACTAL_RUNNER_BACKEND) {
	throw new Error('Environment variable FRACTAL_RUNNER_BACKEND is mandatory');
}

if (env.FRACTAL_SERVER_HOST.endsWith('/')) {
	env.FRACTAL_SERVER_HOST = env.FRACTAL_SERVER_HOST.substring(
		0,
		env.FRACTAL_SERVER_HOST.length - 1
	);
	logger.trace(
		'Removing final slash from FRACTAL_SERVER_HOST, new value is %s',
		env.FRACTAL_SERVER_HOST
	);
}

export async function handle({ event, resolve }) {
	if (event.url.pathname.startsWith('/api')) {
		// API page - AJAX request - handled in proxy'
		logger.trace('API endpoint detected, leaving the handling to the proxy');
		return await resolve(event);
	}

	if (event.route.id === null) {
		if (event.url.pathname.startsWith('/_app')) {
			// The _app folder contains static files that are the result of npm build.
			// The hooks handle function is not called when loading valid static files, however we can
			// reach this point if a not existing file is requested. That could happen after an update
			// if the browser is loading a cached page that references to outdated contents.
			// In that case we can usually ignore the logs.
			logger.trace('[%s] - %s - [NOT FOUND]', event.request.method, event.url.pathname);
		} else {
			logger.info('[%s] - %s - [NOT FOUND]', event.request.method, event.url.pathname);
		}
		error(404, 'Route not found');
	}

	logger.info('[%s] - %s', event.request.method, event.url.pathname);

	// Retrieve server info (alive and version)
	const serverInfo = await getServerInfo(event.fetch);

	// Check if auth cookie is present
	const fastApiUsersAuth = event.cookies.get('fastapiusersauth');
	if (!fastApiUsersAuth) {
		logger.debug('No auth cookie found');
	}

	// Retrieve user info
	let userInfo = null;
	if (serverInfo.alive && fastApiUsersAuth) {
		userInfo = await getUserInfo(event.fetch);
		logger.trace('User: %s', userInfo?.email);
	}

	// Store the pageInfo in locals variable to use the in +layout.server.js
	event.locals['pageInfo'] = { serverInfo, userInfo };

	const isPublicPage =
		event.url.pathname == '/' ||
		event.url.pathname.startsWith('/auth') ||
		event.url.pathname.startsWith('/alive');

	if (isPublicPage) {
		logger.debug('Public page - No auth required');
		return await resolve(event);
	}

	if (!serverInfo.alive && !isPublicPage) {
		// If fractal-server is not available, redirect to the home page to display the maintenance banner
		redirect(302, '/?invalidate=true');
	}

	// Authentication guard
	if (!isPublicPage && userInfo === null) {
		logger.debug('Authentication required - No auth cookie found - Redirecting to login');
		redirect(302, '/auth/login?invalidate=true');
	}

	// Admin area check
	if (event.url.pathname.startsWith('/v2/admin')) {
		if (!(/** @type {import('$lib/types').User} */ (userInfo).is_superuser)) {
			error(403, `Only superusers can access the admin area`);
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
	if (request.url.startsWith(env.FRACTAL_SERVER_HOST)) {
		logger.trace('Including cookie into request to %s, via handleFetch', request.url);
		const cookie = event.request.headers.get('cookie');
		if (cookie) {
			request.headers.set('cookie', cookie);
		}
	}
	return fetch(request);
}

/**
 * @param {typeof fetch} fetch
 * @returns {Promise<import('$lib/types').User|null>}
 */
async function getUserInfo(fetch) {
	try {
		return await getCurrentUser(fetch);
	} catch (error) {
		logger.error('Error loading user info', error);
		return null;
	}
}
