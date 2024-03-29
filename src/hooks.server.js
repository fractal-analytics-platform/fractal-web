import { FRACTAL_SERVER_HOST } from '$env/static/private';
import { error } from '@sveltejs/kit';

export async function handle({ event, resolve }) {
	console.log(`[${event.request.method}] - ${event.url.pathname}`);

	if (event.url.pathname == '/' || event.url.pathname.startsWith('/auth')) {
		console.log('Public page - No auth required');
		return await resolve(event);
	}

	if (event.url.pathname.startsWith('/api')) {
		// API page - AJAX request - handled in proxy'
		return await resolve(event);
	}

	// Authentication guard
	const fastApiUsersAuth = event.cookies.get('fastapiusersauth');
	if (!fastApiUsersAuth) {
		console.log('Authentication required - No auth cookie found - Redirecting to login');
		return new Response(null, {
			status: 302,
			headers: { location: '/auth/login?invalidate=true' }
		});
	}

	const currentUser = await event.fetch(`${FRACTAL_SERVER_HOST}/auth/current-user/`);
	if (!currentUser.ok) {
		console.log('Validation of authentication - Error loading user info');
		return new Response(null, {
			status: 302,
			headers: { location: '/auth/login?invalidate=true' }
		});
	}

	if (event.url.pathname.startsWith('/admin')) {
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

	if (request.url.startsWith(FRACTAL_SERVER_HOST)) {
		console.log(`Including cookie into request to ${request.url}, via handleFetch`);
		const cookie = event.request.headers.get('cookie');
		if (cookie) {
			request.headers.set('cookie', cookie);
		}
	}
	return fetch(request);
}
