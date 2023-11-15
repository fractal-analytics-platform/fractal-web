import { FRACTAL_SERVER_HOST } from '$env/static/private';
import { error, redirect } from '@sveltejs/kit';
import { setCookieFromToken } from '../cookie';

export async function load({ request, fetch, cookies }) {
	const queryStringIndex = request.url.indexOf('?');
	if (queryStringIndex === -1) {
		throw error(400, { message: 'Missing query string' });
	}

	const response = await fetch(
		`${FRACTAL_SERVER_HOST}/auth/github/callback${request.url.substring(queryStringIndex)}`
	);

	if (!response.ok) {
		const result = await response.json();
		throw error(400, { message: JSON.stringify(result) });
	}

	const receivedCookies = response.headers.getSetCookie();

	let fastApiToken = null;
	for (const cookie of receivedCookies) {
		const match = cookie.match(/fastapiusersauth=([^;]*);/);
		if (match) {
			fastApiToken = match[1];
		}
	}

	if (fastApiToken === null) {
		throw error(400, {
			message: 'FastAPI token not found in response cookies'
		});
	}

	setCookieFromToken(cookies, fastApiToken);

	throw redirect(302, '/projects');
}
