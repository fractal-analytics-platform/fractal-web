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
 * @param {boolean} groupIdsNames indicates whether to load the list of group IDs and names.
 * @returns {Promise<import('$lib/types').User|null>}
 */
export async function getCurrentUser(fetch, groupIdsNames = false) {
	logger.debug('Retrieving current user');
	const url = `${env.FRACTAL_SERVER_HOST}/auth/current-user/?group_ids_names=${groupIdsNames}`;
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
 * Fetches user settings
 * @param {typeof fetch} fetch
 * @returns {Promise<import('$lib/types').UserSettings>}
 */
export async function getCurrentUserSettings(fetch) {
	logger.debug('Retrieving current user settings');
	const url = `${env.FRACTAL_SERVER_HOST}/auth/current-user/settings/`;
	const response = await fetch(url, {
		method: 'GET',
		credentials: 'include'
	});

	if (!response.ok) {
		logger.error('Unable to retrieve the current user settings');
		await responseError(response);
	}

	return await response.json();
}

/**
 * Fetches user viewer paths
 * @param {typeof fetch} fetch
 * @returns {Promise<string[]>}
 */
export async function getCurrentUserAllowedViewerPaths(fetch) {
	logger.debug('Retrieving current user viewer paths');
	const url = `${env.FRACTAL_SERVER_HOST}/auth/current-user/allowed-viewer-paths/`;
	const response = await fetch(url, {
		method: 'GET',
		credentials: 'include'
	});

	if (!response.ok) {
		logger.error('Unable to retrieve the current user allowed viewer paths');
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
 * @param {boolean} groupIdsNames indicates whether to load the list of group IDs and names.
 * @returns {Promise<import('$lib/types').User>}
 */
export async function getUser(fetch, userId, groupIdsNames = true) {
	logger.debug('Fetching user [user_id=%d]', userId);
	const response = await fetch(
		`${env.FRACTAL_SERVER_HOST}/auth/users/${userId}/?group_ids_names=${groupIdsNames}`,
		{
			method: 'GET',
			credentials: 'include'
		}
	);

	if (!response.ok) {
		logger.error('Unable to fetch user [user_id=%d]', userId);
		await responseError(response);
	}

	return await response.json();
}

/**
 * Fetches user settings from the server
 * @param {typeof fetch} fetch
 * @param {number|string} userId
 * @returns {Promise<import('$lib/types').UserSettings>}
 */
export async function getUserSettings(fetch, userId) {
	logger.debug('Fetching settings for user [user_id=%d]', userId);
	const response = await fetch(`${env.FRACTAL_SERVER_HOST}/auth/users/${userId}/settings/`, {
		method: 'GET',
		credentials: 'include'
	});

	if (!response.ok) {
		logger.error('Unable to fetch user settings [user_id=%d]', userId);
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
