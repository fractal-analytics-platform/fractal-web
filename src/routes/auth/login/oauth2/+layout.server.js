import { PUBLIC_OAUTH_CLIENT_NAME } from '$env/static/public';
import { FRACTAL_SERVER_HOST } from '$env/static/private';
import { error, redirect } from '@sveltejs/kit';
import { setCookieFromToken } from '../cookie';

export async function load({ request, fetch, cookies }) {
	const queryStringIndex = request.url.indexOf('?');
	if (queryStringIndex === -1) {
		error(400, { message: 'Missing query string' });
	}

	if (!PUBLIC_OAUTH_CLIENT_NAME) {
		error(500, { message: 'Undefined OAuth2 client name' });
	}

	const response = await fetch(
		`${FRACTAL_SERVER_HOST}/auth/${PUBLIC_OAUTH_CLIENT_NAME}/callback/${request.url.substring(
			queryStringIndex
		)}`
	);

	if (!response.ok) {
		const result = await response.json();
		error(400, { message: JSON.stringify(result) });
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
		error(400, {
			message: 'FastAPI token not found in response cookies'
		});
		return;
	}

	setCookieFromToken(request, cookies, fastApiToken);

	redirect(302, '/projects');
}
