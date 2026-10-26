import { userAuthentication } from '#lib/server/api/auth_api.js';
import { getLogger } from '#lib/server/logger.js';
import { isHttpError } from '@sveltejs/kit';
import { setCookieFromToken } from './cookie';
import { PUBLIC_GUEST_USERNAME } from '$app/env/public';

const logger = getLogger('POST /auth/login');

export const POST = async function ({ request, cookies, fetch }) {
	const { username, password } = await request.json();
	const formData = new FormData();
	formData.append('username', username);
	formData.append('password', password);
	// Set auth data
	let authData;
	try {
		authData = await userAuthentication(fetch, formData);
	} catch (error) {
		logger.debug(error);
		const errorMessage = getLoginErrorMessage(error);
		const guestUsername = PUBLIC_GUEST_USERNAME;
		if (guestUsername && formData.get('username') === guestUsername) {
			return Response.json({ invalidGuestMessage: errorMessage, invalid: true }, { status: 400 });
		} else {
			return Response.json({ invalidMessage: errorMessage, invalid: true }, { status: 400 });
		}
	}

	setCookieFromToken(request, cookies, authData.access_token);
	return Response.json({ invalid: false }, { status: 200 });
};

/**
 * @param {unknown} error
 */
function getLoginErrorMessage(error) {
	if (isHttpError(error)) {
		if (error.status === 400 && error.body.message === 'LOGIN_BAD_CREDENTIALS') {
			return 'Invalid credentials';
		} else if (error.status === 404) {
			return 'Basic auth login has been disabled';
		}
	}
	return 'Unexpected error';
}
