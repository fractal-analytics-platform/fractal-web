import { FRACTAL_SERVER_HOST } from '$env/static/private';
import { responseError } from '$lib/common/errors';
import { getLogger } from '$lib/server/logger.js';

const logger = getLogger('workflow API [v1]');

/**
 * Fetches all the workflows of a user
 * @param {typeof fetch} fetch
 * @returns {Promise<*>}
 */
export async function getUserWorkflows(fetch) {
	logger.debug('Fetching user workflows');
	const response = await fetch(FRACTAL_SERVER_HOST + `/api/v1/workflow/`, {
		method: 'GET',
		credentials: 'include'
	});

	if (response.ok) {
		return await response.json();
	}

	logger.debug('Unable to fetch user workflows');
	await responseError(response);
}

/**
 * Fetches a project's workflow from the server
 * @param {typeof fetch} fetch
 * @param {string} projectId
 * @param {string} workflowId
 * @returns {Promise<*>}
 */
export async function getWorkflow(fetch, projectId, workflowId) {
	logger.debug('Fetching workflow [workflow_id=%d] [project_id=%d]', workflowId, projectId);
	const response = await fetch(
		FRACTAL_SERVER_HOST + `/api/v1/project/${projectId}/workflow/${workflowId}/`,
		{
			method: 'GET',
			credentials: 'include'
		}
	);

	if (response.ok) {
		return await response.json();
	}

	logger.error('Unable to fetch workflow [workflow_id=%d] [project_id=%d]', workflowId, projectId);
	await responseError(response);
}

/**
 * Fetches the jobs of a given workflow from the server
 * @param {typeof fetch} fetch
 * @param {number|string} projectId
 * @param {number|string} workflowId
 * @returns {Promise<*>}
 */
export async function getWorkflowJobs(fetch, projectId, workflowId) {
	logger.debug('Fetching workflow jobs [workflow_id=%d] [project_id=%d]', workflowId, projectId);
	const response = await fetch(
		FRACTAL_SERVER_HOST + `/api/v1/project/${projectId}/workflow/${workflowId}/job/`,
		{
			method: 'GET',
			credentials: 'include'
		}
	);

	if (response.ok) {
		return await response.json();
	}

	logger.error(
		'Unable to fetch workflow jobs [workflow_id=%d] [project_id=%d]',
		workflowId,
		projectId
	);
	await responseError(response);
}
