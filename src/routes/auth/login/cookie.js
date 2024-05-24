import * as jose from 'jose';
import { env } from '$env/dynamic/private';

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
		domain: `${env.AUTH_COOKIE_DOMAIN || new URL(request.url).hostname}`,
		path: `${env.AUTH_COOKIE_PATH || '/'}`,
		expires: new Date(/** @type {number} */ (tokenClaims.exp) * 1000),
		sameSite: /** @type {'lax' | 'strict' | 'none'} */ (`${env.AUTH_COOKIE_SAME_SITE || 'lax'}`),
		secure: `${env.AUTH_COOKIE_SECURE}` === 'true',
		httpOnly: `${env.AUTH_COOKIE_HTTP_ONLY}` !== 'false'
	};
	cookies.set(env.AUTH_COOKIE_NAME || 'fastapiusersauth', accessToken, cookieOptions);
}
