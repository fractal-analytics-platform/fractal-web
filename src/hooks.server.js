import { FRACTAL_SERVER_HOST } from '$env/static/private';

export async function handle({ event, resolve }) {
	console.log(`[${event.request.method}] - ${event.url.pathname}`);

	if (event.url.pathname == '/' || event.url.pathname.startsWith('/auth')) {
		console.log('Public page - No auth required');
		return await resolve(event);
	}

	// Authentication guard
	const fastApiUsersAuth = event.cookies.get('fastapiusersauth');
	if (!fastApiUsersAuth) {
		console.log('Authentication required - No auth cookie found - Redirecting to login');
		return new Response(null, { status: 302, headers: { location: '/auth/login' } });
	}

	const whoami = await event.fetch(`${FRACTAL_SERVER_HOST}/auth/whoami`);
	if (whoami.ok) {
		return await resolve(event);
	} else {
		console.log('Validation of authentication - Error loading user info');
		return new Response(null, { status: 302, headers: { location: '/auth/login' } });
	}
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
        request.headers.set('cookie', event.request.headers.get('cookie'));
    }
    return fetch(request);
}
