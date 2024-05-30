import { env } from '$env/dynamic/private';
import { responseError } from '$lib/common/errors';
import { getLogger } from '$lib/server/logger.js';

const logger = getLogger('workflow API [v2]');

/**
 * Fetches the list of workflows of a project from the server
 * @param {typeof fetch} fetch
 * @param {number|string} projectId
 * @returns {Promise<Array<import('$lib/types-v2').WorkflowV2>>}
 */
export async function getWorkflows(fetch, projectId) {
	logger.debug('Fetching project workflows [project_id=%d]', projectId);
	const response = await fetch(env.FRACTAL_SERVER_HOST + `/api/v2/project/${projectId}/workflow/`, {
		method: 'GET',
		credentials: 'include'
	});

	if (!response.ok) {
		logger.error('Unable to fetch project workflows [project_id=%d]', projectId);
		await responseError(response);
	}

	return await response.json();
}

/**
 * Fetches a project's workflow from the server
 * @param {typeof fetch} fetch
 * @param {string} projectId
 * @param {string} workflowId
 * @returns {Promise<import('$lib/types-v2').WorkflowV2>}
 */
export async function getWorkflow(fetch, projectId, workflowId) {
	logger.debug('Fetching workflow [workflow_id=%d] [project_id=%d]', workflowId, projectId);
	const response = await fetch(
		env.FRACTAL_SERVER_HOST + `/api/v2/project/${projectId}/workflow/${workflowId}/`,
		{
			method: 'GET',
			credentials: 'include'
		}
	);

	if (!response.ok) {
		logger.error(
			'Unable to fetch workflow [workflow_id=%d] [project_id=%d]',
			workflowId,
			projectId
		);
		await responseError(response);
	}

	return await response.json();
}

/**
 * Fetches the jobs of a given workflow from the server
 * @param {typeof fetch} fetch
 * @param {number|string} projectId
 * @param {number|string} workflowId
 * @returns {Promise<Array<import('$lib/types-v2').ApplyWorkflowV2>>}
 */
export async function getWorkflowJobs(fetch, projectId, workflowId) {
	logger.debug('Fetching workflow jobs [workflow_id=%d] [project_id=%d]', workflowId, projectId);
	const response = await fetch(
		env.FRACTAL_SERVER_HOST + `/api/v2/project/${projectId}/workflow/${workflowId}/job/`,
		{
			method: 'GET',
			credentials: 'include'
		}
	);

	if (!response.ok) {
		logger.error(
			`Unable to fetch workflow jobs [workflow_id=${workflowId}] [project_id=${projectId}]`
		);
		await responseError(response);
	}

	return await response.json();
}
