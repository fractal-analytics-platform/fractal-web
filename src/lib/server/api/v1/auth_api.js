import { FRACTAL_SERVER_HOST } from '$env/static/private';
import { responseError } from '$lib/common/errors';

/**
 * Request to authenticate user
 * @param {typeof fetch} fetch
 * @param {any} data
 * @returns {Promise<*>}
 */
export async function userAuthentication(fetch, data) {
	const response = await fetch(FRACTAL_SERVER_HOST + '/auth/token/login/', {
		method: 'POST',
		credentials: 'include',
		mode: 'cors',
		body: data
	});

	if (response.ok) {
		return await response.json();
	}

	await responseError(response);
}

/**
 * Fetches user identity
 * @param {typeof fetch} fetch
 * @returns {Promise<*>}
 */
export async function whoami(fetch) {
	const response = await fetch(FRACTAL_SERVER_HOST + '/auth/whoami/', {
		method: 'GET',
		credentials: 'include',
		mode: 'cors'
	});

	if (response.ok) {
		return await response.json();
	}

	await responseError(response);
}

/**
 * Requests to close a user session on the server
 * @param {typeof fetch} fetch
 * @returns {Promise<void>}
 */
export async function logout(fetch) {
	const response = await fetch(FRACTAL_SERVER_HOST + '/auth/token/logout/', {
		method: 'POST',
		credentials: 'include',
		mode: 'cors'
	});

	if (response.ok) {
		console.log('Logout successful');
		return;
	}

	console.error('Logout failed');
	await responseError(response);
}

/**
 * Fetches the list of users from the server
 * @param {typeof fetch} fetch
 * @returns {Promise<*>}
 */
export async function listUsers(fetch) {
	const response = await fetch(FRACTAL_SERVER_HOST + '/auth/userlist', {
		method: 'GET',
		credentials: 'include'
	});

	if (response.ok) {
		return await response.json();
	}

	await responseError(response);
}
