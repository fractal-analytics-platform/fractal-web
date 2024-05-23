import { FRACTAL_SERVER_HOST } from '$env/static/private';
import { responseError } from '$lib/common/errors';
import { getLogger } from '$lib/server/logger.js';

const logger = getLogger('auth API');

/**
 * Request to authenticate user
 * @param {typeof fetch} fetch
 * @param {any} data
 * @returns {Promise<{ access_token: string }>}
 */
export async function userAuthentication(fetch, data) {
	logger.debug('Performing login');
	const response = await fetch(FRACTAL_SERVER_HOST + '/auth/token/login/', {
		method: 'POST',
		credentials: 'include',
		body: data
	});

	if (!response.ok) {
		logger.info('Login failed');
		await responseError(response);
	}

	return await response.json();
}

/**
 * Fetches user identity
 * @param {typeof fetch} fetch
 * @returns {Promise<import('$lib/types').User>}
 */
export async function getCurrentUser(fetch) {
	logger.debug('Retrieving current user');
	const response = await fetch(FRACTAL_SERVER_HOST + '/auth/current-user/', {
		method: 'GET',
		credentials: 'include'
	});

	if (!response.ok) {
		logger.info('Unable to retrieve the current user');
		await responseError(response);
	}

	return await response.json();
}

/**
 * Requests to close a user session on the server
 * @param {typeof fetch} fetch
 * @returns {Promise<void>}
 */
export async function logout(fetch) {
	logger.debug('Performing logout');
	const response = await fetch(FRACTAL_SERVER_HOST + '/auth/token/logout/', {
		method: 'POST',
		credentials: 'include',
		mode: 'cors'
	});

	if (!response.ok) {
		logger.error('Logout failed');
		await responseError(response);
	}

	logger.debug('Logout successful');
}

/**
 * Fetches the list of users from the server
 * @param {typeof fetch} fetch
 * @returns {Promise<Array<import('$lib/types').User>>}
 */
export async function listUsers(fetch) {
	logger.debug('Fetching the list of users');
	const response = await fetch(FRACTAL_SERVER_HOST + '/auth/users/', {
		method: 'GET',
		credentials: 'include'
	});

	if (!response.ok) {
		logger.error('Unable to fetch the list of users');
		await responseError(response);
	}

	return await response.json();
}

/**
 * Fetches a user from the server
 * @param {typeof fetch} fetch
 * @param {number|string} userId
 * @returns {Promise<import('$lib/types').User>}
 */
export async function getUser(fetch, userId) {
	logger.debug('Fetching user [user_id=%d]', userId);
	const response = await fetch(`${FRACTAL_SERVER_HOST}/auth/users/${userId}/`, {
		method: 'GET',
		credentials: 'include'
	});

	if (!response.ok) {
		logger.error('Unable to fetch user [user_id=%d]', userId);
		await responseError(response);
	}

	return await response.json();
}
