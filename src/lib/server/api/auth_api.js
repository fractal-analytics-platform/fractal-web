import { env } from '$env/dynamic/private';
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
	const response = await fetch(env.FRACTAL_SERVER_HOST + '/auth/token/login/', {
		method: 'POST',
		credentials: 'include',
		body: data
	});

	if (!response.ok) {
		logger.warn('Login failed');
		await responseError(response);
	}

	return await response.json();
}

/**
 * Fetches user identity
 * @param {typeof fetch} fetch
 * @param {boolean} groupNames indicates whether to load the list of group names.
 * @returns {Promise<import('$lib/types').User|null>}
 */
export async function getCurrentUser(fetch, groupNames = false) {
	logger.debug('Retrieving current user');
	const url = `${env.FRACTAL_SERVER_HOST}/auth/current-user/?group_names=${groupNames}`;
	const response = await fetch(url, {
		method: 'GET',
		credentials: 'include'
	});

	if (!response.ok) {
		logger.warn('Unable to retrieve the current user');
		return null;
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
	const response = await fetch(env.FRACTAL_SERVER_HOST + '/auth/token/logout/', {
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
	const response = await fetch(env.FRACTAL_SERVER_HOST + '/auth/users/', {
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
 * @param {boolean} groupIds indicates whether to load the list of group IDs.
 * @returns {Promise<import('$lib/types').User>}
 */
export async function getUser(fetch, userId, groupIds = true) {
	logger.debug('Fetching user [user_id=%d]', userId);
	const response = await fetch(`${env.FRACTAL_SERVER_HOST}/auth/users/${userId}/?group_ids=${groupIds}`, {
		method: 'GET',
		credentials: 'include'
	});

	if (!response.ok) {
		logger.error('Unable to fetch user [user_id=%d]', userId);
		await responseError(response);
	}

	return await response.json();
}

/**
 * Fetches the list of groups from the server
 * @param {typeof fetch} fetch
 * @param {boolean} userIds indicates whether to load the list of user IDs.
 * @returns {Promise<Array<import('$lib/types').Group>>}
 */
export async function listGroups(fetch, userIds = false) {
	logger.debug('Fetching groups');
	const url = `${env.FRACTAL_SERVER_HOST}/auth/group/?user_ids=${userIds}`;
	const response = await fetch(url, {
		method: 'GET',
		credentials: 'include'
	});

	if (!response.ok) {
		logger.error('Unable to fetch groups');
		await responseError(response);
	}

	return await response.json();
}

/**
 * Fetches a group from the server
 * @param {typeof fetch} fetch
 * @param {number|string} groupId
 * @returns {Promise<Array<import('$lib/types').Group>>}
 */
export async function getGroup(fetch, groupId) {
	logger.debug('Fetching group %d', groupId);
	const url = `${env.FRACTAL_SERVER_HOST}/auth/group/${groupId}/`;
	const response = await fetch(url, {
		method: 'GET',
		credentials: 'include'
	});

	if (!response.ok) {
		logger.error('Unable to fetch group %d', groupId);
		await responseError(response);
	}

	return await response.json();
}
