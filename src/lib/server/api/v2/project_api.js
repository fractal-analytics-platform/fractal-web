import { FRACTAL_SERVER_HOST } from '$env/static/private';
import { responseError } from '$lib/common/errors';
import { getLogger } from '$lib/server/logger.js';

const logger = getLogger('projects API [v2]');

// PROJECT ENDPOINTS

/**
 * Fetches the list of projects from the server
 * @param {typeof fetch} fetch
 * @returns {Promise<*>}
 */
export async function listProjects(fetch) {
	logger.debug('Fetching the list of projects');
	const response = await fetch(FRACTAL_SERVER_HOST + '/api/v2/project/', {
		method: 'GET',
		credentials: 'include'
	});

	if (response.ok) {
		return await response.json();
	}

	logger.error('Unable to fetch projects list');
	await responseError(response);
}

/**
 * Fetches a project from the server
 * @param {typeof fetch} fetch
 * @param {string} projectId
 * @returns {Promise<*>}
 */
export async function getProject(fetch, projectId) {
	logger.debug('Fetching project [project_id=%d]', projectId);
	const response = await fetch(FRACTAL_SERVER_HOST + `/api/v2/project/${projectId}/`, {
		method: 'GET',
		credentials: 'include'
	});

	if (response.ok) {
		// Return fetched project as json object
		return await response.json();
	}

	logger.error('Unable to fetch project [project_id=%d]', projectId);
	await responseError(response);
}

// DATASET ENDPOINTS

/**
 * Fetches all the project's datasets from the server
 * @param {typeof fetch} fetch
 * @param {number|string} projectId
 * @returns {Promise<*>}
 */
export async function getProjectDatasets(fetch, projectId) {
	const response = await fetch(
		FRACTAL_SERVER_HOST + `/api/v2/project/${projectId}/dataset/?history=false`,
		{
			method: 'GET',
			credentials: 'include'
		}
	);

	if (response.ok) {
		// Return the dataset as json object
		/** @type {import('$lib/types.js').Dataset[]} */
		const datasets = await response.json();
		datasets.sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));
		return datasets;
	}

	await responseError(response);
}

/**
 * Fetches a project's dataset from the server
 * @param fetch
 * @param projectId
 * @param datasetId
 * @returns {Promise<*>}
 */
export async function getDataset(fetch, projectId, datasetId) {
	logger.debug('Retrieving dataset [dataset_id=%d] [project_id=%d]', datasetId, projectId);
	const response = await fetch(
		FRACTAL_SERVER_HOST + `/api/v2/project/${projectId}/dataset/${datasetId}/`,
		{
			method: 'GET',
			credentials: 'include'
		}
	);

	if (response.ok) {
		// Return the dataset as json object
		return await response.json();
	}

	logger.error('Unable to fetch dataset [dataset_id=%d] [project_id=%d]', datasetId, projectId);
	await responseError(response);
}

// WORKFLOW ENDPOINTS

/**
 * Fetches the list of workflows of a project from the server
 * @param fetch
 * @param projectId
 * @returns {Promise<*>}
 */
export async function getWorkflows(fetch, projectId) {
	const response = await fetch(FRACTAL_SERVER_HOST + `/api/v2/project/${projectId}/workflow/`, {
		method: 'GET',
		credentials: 'include'
	});

	if (response.ok) {
		// If the response is ok, return the workflows list as json
		return await response.json();
	}

	await responseError(response);
}

/**
 * Fetches the list of workflows of a project from the server
 * @param {typeof fetch} fetch
 * @param {number|string}projectId
 * @param {number|string} workflowId
 * @returns {Promise<*>}
 */
export async function getWorkflow(fetch, projectId, workflowId) {
	logger.debug('Fetching project workflows [project_id=%d]', projectId);
	const response = await fetch(
		FRACTAL_SERVER_HOST + `/api/v2/project/${projectId}/workflow/${workflowId}/`,
		{
			method: 'GET',
			credentials: 'include'
		}
	);

	if (response.ok) {
		// If the response is ok, return the workflow as json
		return await response.json();
	}

	logger.error('Unable to fetch project workflows [project_id=%d]', projectId);
	await responseError(response);
}

// JOB ENDPOINTS

/**
 * Fetches the list of jobs of a project from the server
 * @param {typeof fetch} fetch
 * @param {number|string} projectId
 * @returns {Promise<*>}
 */
export async function getProjectJobs(fetch, projectId) {
	logger.debug('Fetching project jobs [project_id=%d]', projectId);
	const response = await fetch(
		FRACTAL_SERVER_HOST + `/api/v2/project/${projectId}/job/?log=false`,
		{
			method: 'GET',
			credentials: 'include'
		}
	);

	if (response.ok) {
		return await response.json();
	}

	logger.error('Unable to fetch project jobs [project_id=%d]', projectId);
	await responseError(response);
}

/**
 * Fetches the list of all the jobs belonging to the current user
 * @param {typeof fetch} fetch
 * @returns {Promise<*>}
 */
export async function getUserJobs(fetch) {
	logger.debug('Fetching user jobs');
	const response = await fetch(FRACTAL_SERVER_HOST + `/api/v2/job/?log=false`, {
		method: 'GET',
		credentials: 'include'
	});

	if (response.ok) {
		return await response.json();
	}

	logger.error('Unable to fetch user jobs');
	await responseError(response);
}
