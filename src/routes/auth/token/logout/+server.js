import { logout } from '$lib/server/api/v1/auth_api';
import { env } from '$env/dynamic/private';

export async function POST({ fetch, request, cookies }) {
	await logout(fetch);

	// Set the fastapiusersauth cookie to expire in the past
	// This will delete the cookie
	cookies.set(env.AUTH_COOKIE_NAME || 'fastapiusersauth', '', {
		domain: `${env.AUTH_COOKIE_DOMAIN || new URL(request.url).hostname}`,
		path: `${env.AUTH_COOKIE_PATH || '/'}`,
		expires: new Date(0),
		sameSite: /** @type {'lax' | 'strict' | 'none'} */ (`${env.AUTH_COOKIE_SAME_SITE || 'lax'}`),
		secure: `${env.AUTH_COOKIE_SECURE}` === 'true',
		httpOnly: `${env.AUTH_COOKIE_HTTP_ONLY}` !== 'false'
	});

	return new Response(null, { status: 204 });
}
