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
	throw new Error('Unable to list projects');
}

/**
 * Fetches a project from the server
 * @param {typeof fetch} fetch
 * @param {string} projectId
 * @returns {Promise<*>}
 */
export async function getProject(fetch, projectId) {
	const response = await fetch(FRACTAL_SERVER_HOST + `/api/v1/project/${projectId}`, {
		method: 'GET',
		credentials: 'include',
		mode: 'cors'
	});

	if (response.ok) {
		// Return fetched project as json object
		return await response.json();
	}

	await responseError(response);
}

// DATASET ENDPOINTS

/**
 * Fetches a project's dataset from the server
 * @param fetch
 * @param projectId
 * @param datasetId
 * @returns {Promise<*>}
 */
export async function getDataset(fetch, projectId, datasetId) {
	const response = await fetch(
		FRACTAL_SERVER_HOST + `/api/v1/project/${projectId}/dataset/${datasetId}`,
		{
			method: 'GET',
			credentials: 'include',
			mode: 'cors'
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
		credentials: 'include',
		mode: 'cors'
	});

	if (response.ok) {
		// If the response is ok, return the workflows list as json
		return await response.json();
	}

	throw new Error('The client was not able to fetch project workflows');
}

// JOB ENDPOINTS

/**
 * Fetches the list of jobs of a project from the server
 * @param fetch
 * @param projectId
 * @returns {Promise<*>}
 */
export async function getJobs(fetch, projectId) {
	const response = await fetch(FRACTAL_SERVER_HOST + `/api/v1/project/${projectId}/job/`, {
		method: 'GET',
		credentials: 'include',
		mode: 'cors'
	});

	if (response.ok) {
		return await response.json();
	}

	throw new Error('The client was not able to fetch project jobs');
}
