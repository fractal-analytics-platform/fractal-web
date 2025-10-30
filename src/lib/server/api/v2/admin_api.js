import { env } from '$env/dynamic/private';
import { responseError } from '$lib/common/errors';
import { getLogger } from '$lib/server/logger.js';

const logger = getLogger('admin API [v2]');

/**
 * Request to impersonate user
 * @param {typeof fetch} fetch
 * @param {number} userId
 * @returns {Promise<{ access_token: string }>}
 */
export async function userImpersonation(fetch, userId) {
	logger.debug(`Impersonating user ${userId}`);
	const response = await fetch(`${env.FRACTAL_SERVER_HOST}/admin/v2/impersonate/${userId}/`, {
		method: 'GET',
		credentials: 'include'
	});

	if (!response.ok) {
		logger.warn('Impersonation failed');
		await responseError(response);
	}

	return await response.json();
}

/**
 * @param {typeof fetch} fetch
 * @param {number} resourceId
 * @returns {Promise<import('fractal-components/types/api').Resource>}
 */
export async function getResource(fetch, resourceId) {
	logger.debug(`Retrieving resource ${resourceId}`);
	const response = await fetch(`${env.FRACTAL_SERVER_HOST}/admin/v2/resource/${resourceId}/`, {
		method: 'GET',
		credentials: 'include'
	});

	if (!response.ok) {
		await responseError(response);
	}

	return await response.json();
}

/**
 * @param {typeof fetch} fetch
 * @returns {Promise<import('fractal-components/types/api').Profile[]>}
 */
export async function getProfiles(fetch) {
	logger.debug(`Retrieving profiles`);
	const response = await fetch(`${env.FRACTAL_SERVER_HOST}/admin/v2/profile/`, {
		method: 'GET',
		credentials: 'include'
	});

	if (!response.ok) {
		await responseError(response);
	}

	return await response.json();
}

/**
 * @param {typeof fetch} fetch
 * @param {number} profileId
 * @returns {Promise<import('fractal-components/types/api').Profile>}
 */
export async function getProfile(fetch, profileId) {
	logger.debug(`Retrieving profile ${profileId}`);
	const response = await fetch(`${env.FRACTAL_SERVER_HOST}/admin/v2/profile/${profileId}/`, {
		method: 'GET',
		credentials: 'include'
	});

	if (!response.ok) {
		await responseError(response);
	}

	return await response.json();
}
