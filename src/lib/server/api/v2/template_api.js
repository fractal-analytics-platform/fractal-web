import { env } from '$env/dynamic/private';
import { responseError } from '$lib/common/errors.server';
import { getLogger } from '$lib/server/logger.js';

const logger = getLogger('Template API');

/**
 * Fetches the available workflow templates from the server
 * @param {typeof fetch} fetch
*  @param {number} page
 * @param {number} pageSize
 * @returns {Promise<Array<import('fractal-components/types/api').TemplatePage>>}
 */
export async function getTemplates(fetch, page, pageSize) {
	logger.debug('Fetching workflow templates');
	const response = await fetch(
		env.FRACTAL_SERVER_HOST + `/api/v2/workflow_template/?page=${page}&page_size=${pageSize}`,
		{
			method: 'GET',
			credentials: 'include'
		}
	);

	if (!response.ok) {
		logger.error('Unable to fetch workflow templates');
		await responseError(response);
	}

	return await response.json();
}

