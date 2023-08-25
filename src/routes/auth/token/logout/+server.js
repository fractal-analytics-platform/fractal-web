import { logout } from '$lib/server/api/v1/auth_api';
import {
	AUTH_COOKIE_NAME,
	AUTH_COOKIE_DOMAIN,
	AUTH_COOKIE_PATH,
	AUTH_COOKIE_SAME_SITE,
	AUTH_COOKIE_SECURE,
	AUTH_COOKIE_HTTP_ONLY
} from '$env/static/private';

export async function POST({fetch, cookies}) {
	
	await logout(fetch);

	// Set the fastapiusersauth cookie to expire in the past
	// This will delete the cookie
	cookies.set(AUTH_COOKIE_NAME, '', {
		domain: `${AUTH_COOKIE_DOMAIN}`,
		path: `${AUTH_COOKIE_PATH}`,
		expires: new Date(0),
		sameSite: `${AUTH_COOKIE_SAME_SITE}`,
		secure: `${AUTH_COOKIE_SECURE}` === 'true',
		httpOnly: `${AUTH_COOKIE_HTTP_ONLY}` === 'true'
	});

	return new Response(null, { status: 204 });
}
