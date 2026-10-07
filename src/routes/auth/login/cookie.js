import * as jose from 'jose';

import {
	AUTH_COOKIE_PATH,
	AUTH_COOKIE_SAME_SITE,
	AUTH_COOKIE_SECURE,
	AUTH_COOKIE_NAME,
	AUTH_COOKIE_DOMAIN
} from '$app/env/private';

/**
 * @param {Request} request
 * @param {import('@sveltejs/kit').Cookies} cookies
 * @param {string} accessToken
 */
export function setCookieFromToken(request, cookies, accessToken) {
	// Decode JWT token claims
	const tokenClaims = jose.decodeJwt(accessToken);

	// Set the authentication cookie
	const cookieOptions = {
		path: `${AUTH_COOKIE_PATH || '/'}`,
		expires: new Date(/** @type {number} */ (tokenClaims.exp * 1000)),
		sameSite: /** @type {'lax' | 'strict' | 'none'} */ (`${AUTH_COOKIE_SAME_SITE || 'lax'}`),
		secure: `${AUTH_COOKIE_SECURE}` !== 'false',
		httpOnly: true
	};

	if (!AUTH_COOKIE_NAME || !AUTH_COOKIE_NAME.startsWith('__Host-')) {
		cookieOptions.domain = `${AUTH_COOKIE_DOMAIN || new URL(request.url).hostname}`;
	}

	cookies.set(AUTH_COOKIE_NAME || 'fastapiusersauth', accessToken, cookieOptions);
}
