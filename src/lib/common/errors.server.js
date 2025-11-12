import { getLogger } from '$lib/server/logger';
import { error } from '@sveltejs/kit';

const logger = getLogger('errors');

/**
 * Propagates an error response.
 * @param {Response} response
 */
export async function responseError(response) {
	let errorResponse;
	if (response.status === 500) {
		errorResponse = response.statusText;
	} else {
		errorResponse = await response.json();
		logger.debug('Error response body: %s', errorResponse);
		if ('detail' in errorResponse) {
			errorResponse = errorResponse.detail;
		}
	}
	error(response.status, errorResponse);
}
