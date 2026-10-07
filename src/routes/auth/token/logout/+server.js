import { logout } from '#lib/server/api/auth_api.js';

import {
	AUTH_COOKIE_PATH,
	AUTH_COOKIE_SAME_SITE,
	AUTH_COOKIE_SECURE,
	AUTH_COOKIE_NAME,
	AUTH_COOKIE_DOMAIN
} from '$app/env/private';

export async function POST({ fetch, request, cookies }) {
	await logout(fetch);

	// Set the fastapiusersauth cookie to expire in the past
	// This will delete the cookie
	const cookieOptions = {
		path: `${AUTH_COOKIE_PATH || '/'}`,
		expires: new Date(0),
		sameSite: /** @type {'lax' | 'strict' | 'none'} */ (`${AUTH_COOKIE_SAME_SITE || 'lax'}`),
		secure: `${AUTH_COOKIE_SECURE}` !== 'false',
		httpOnly: true
	};

	if (!AUTH_COOKIE_NAME || !AUTH_COOKIE_NAME.startsWith('__Host-')) {
		cookieOptions.domain = `${AUTH_COOKIE_DOMAIN || new URL(request.url).hostname}`;
	}

	cookies.set(AUTH_COOKIE_NAME || 'fastapiusersauth', '', cookieOptions);

	return new Response(null, { status: 204 });
}
