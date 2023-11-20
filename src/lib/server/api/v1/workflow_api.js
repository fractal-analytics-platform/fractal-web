import { FRACTAL_SERVER_HOST } from '$env/static/private';
import { responseError } from '$lib/common/errors';

/**
 * Fetches all the workflows of a user
 * @param {typeof fetch} fetch
 * @returns {Promise<*>}
 */
export async function getUserWorkflows(fetch) {
	const response = await fetch(
		FRACTAL_SERVER_HOST + `/api/v1/project/workflow/`,
		{
			method: 'GET',
			credentials: 'include'
		}
	);

	if (response.ok) {
		return await response.json();
	}

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
	const response = await fetch(
		FRACTAL_SERVER_HOST + `/api/v1/project/${projectId}/workflow/${workflowId}`,
		{
			method: 'GET',
			credentials: 'include'
		}
	);

	if (response.ok) {
		return await response.json();
	}

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

	await responseError(response);
}
