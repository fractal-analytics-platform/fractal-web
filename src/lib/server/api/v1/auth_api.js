import { FRACTAL_SERVER_HOST } from '$env/static/private';

/**
 * Request to authenticate user
 * @param fetch
 * @param data
 * @returns {Promise<*>}
 */
export async function userAuthentication(fetch, data) {
	const response = await fetch(FRACTAL_SERVER_HOST + '/auth/token/login', {
		method: 'POST',
		credentials: 'include',
		mode: 'cors',
		body: data
	});

	if (!response.ok) {
		throw new Error('Authentication failed');
	}

	return await response.json();
}

/**
 * Fetches user identity
 * @param fetch
 * @returns {Promise<*>}
 */
export async function whoami(fetch) {
	const response = await fetch(FRACTAL_SERVER_HOST + '/auth/whoami', {
		method: 'GET',
		credentials: 'include',
		mode: 'cors'
	});

	if (response.ok) {
		return await response.json();
	}

	throw new Error('Unable to fetch user identity');
}

/**
 * Requests to close a user session on the server
 * @param fetch
 * @returns {Promise<void>}
 */
export async function logout(fetch) {
	const response = await fetch(FRACTAL_SERVER_HOST + '/auth/token/logout', {
		method: 'POST',
		credentials: 'include',
		mode: 'cors'
	});

	if (!response.ok) {
		throw new Error('Logout failed');
	}
}
