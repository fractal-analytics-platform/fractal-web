import { FRACTAL_SERVER_HOST } from '$env/static/private';
import { responseError } from '$lib/common/errors';

// PROJECT ENDPOINTS

/**
 * Fetches the list of projects from the server
 * @param {typeof fetch} fetch
 * @returns {Promise<*>}
 */
export async function listProjects(fetch) {
	const response = await fetch(FRACTAL_SERVER_HOST + '/api/v1/project/', {
		method: 'GET',
		credentials: 'include'
	});

	if (response.ok) {
		return await response.json();
	}

	console.error('Client unable to fetch projects list');
	await responseError(response);
}

/**
 * Fetches a project from the server
 * @param {typeof fetch} fetch
 * @param {string} projectId
 * @returns {Promise<*>}
 */
export async function getProject(fetch, projectId) {
	const response = await fetch(FRACTAL_SERVER_HOST + `/api/v1/project/${projectId}/`, {
		method: 'GET',
		credentials: 'include'
	});

	if (response.ok) {
		// Return fetched project as json object
		return await response.json();
	}

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
		FRACTAL_SERVER_HOST + `/api/v1/project/${projectId}/dataset/`,
		{
			method: 'GET',
			credentials: 'include'
		}
	);

	if (response.ok) {
		// Return the dataset as json object
		return await response.json();
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
	const response = await fetch(
		FRACTAL_SERVER_HOST + `/api/v1/project/${projectId}/dataset/${datasetId}/`,
		{
			method: 'GET',
			credentials: 'include'
		}
	);

	if (response.ok) {
		// Return the dataset as json object
		return await response.json();
	}

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
	const response = await fetch(FRACTAL_SERVER_HOST + `/api/v1/project/${projectId}/workflow/`, {
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
	const response = await fetch(
		FRACTAL_SERVER_HOST + `/api/v1/project/${projectId}/workflow/${workflowId}/`,
		{
			method: 'GET',
			credentials: 'include'
		}
	);

	if (response.ok) {
		// If the response is ok, return the workflow as json
		return await response.json();
	}

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
	const response = await fetch(FRACTAL_SERVER_HOST + `/api/v1/project/${projectId}/job/`, {
		method: 'GET',
		credentials: 'include'
	});

	if (response.ok) {
		return await response.json();
	}

	await responseError(response);
}

/**
 * Fetches the list of all the jobs belonging to the current user
 * @param {typeof fetch} fetch
 * @returns {Promise<*>}
 */
export async function getUserJobs(fetch) {
	const response = await fetch(FRACTAL_SERVER_HOST + `/api/v1/job/`, {
		method: 'GET',
		credentials: 'include'
	});

	if (response.ok) {
		return await response.json();
	}

	await responseError(response);
}
