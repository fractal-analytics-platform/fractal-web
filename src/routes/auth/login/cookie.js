import * as jose from 'jose';
import {
	AUTH_COOKIE_NAME,
	AUTH_COOKIE_DOMAIN,
	AUTH_COOKIE_PATH,
	AUTH_COOKIE_SAME_SITE,
	AUTH_COOKIE_SECURE,
	AUTH_COOKIE_HTTP_ONLY
} from '$env/static/private';

/**
 * @param {import('@sveltejs/kit').Cookies} cookies
 * @param {string} accessToken
 */
export function setCookieFromToken(cookies, accessToken) {
	// Decode JWT token claims
	const tokenClaims = jose.decodeJwt(accessToken);

	// Set the authentication cookie
	const cookieOptions = {
		domain: `${AUTH_COOKIE_DOMAIN}`,
		path: `${AUTH_COOKIE_PATH}`,
		expires: new Date(/** @type {number} */ (tokenClaims.exp) * 1000),
		sameSite: /** @type {'lax' | 'strict' | 'none'} */ (`${AUTH_COOKIE_SAME_SITE}`),
		secure: `${AUTH_COOKIE_SECURE}` === 'true',
		httpOnly: `${AUTH_COOKIE_HTTP_ONLY}` === 'true'
	};
	cookies.set(AUTH_COOKIE_NAME, accessToken, cookieOptions);
}
