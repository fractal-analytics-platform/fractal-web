import { env } from '$env/dynamic/private';
import { responseError } from '$lib/common/errors';
import { getLogger } from '$lib/server/logger.js';

const logger = getLogger('projects API [v1]');

// PROJECT ENDPOINTS

/**
 * Fetches the list of projects from the server
 * @param {typeof fetch} fetch
 * @returns {Promise<Array<import('$lib/types').Project>>}
 */
export async function listProjects(fetch) {
	logger.debug('Fetching the list of projects');
	const response = await fetch(env.FRACTAL_SERVER_HOST + '/api/v1/project/', {
		method: 'GET',
		credentials: 'include'
	});

	if (!response.ok) {
		logger.error('Unable to fetch projects list');
		await responseError(response);
	}

	return await response.json();
}

/**
 * Fetches a project from the server
 * @param {typeof fetch} fetch
 * @param {string} projectId
 * @returns {Promise<import('$lib/types').Project>}
 */
export async function getProject(fetch, projectId) {
	logger.debug('Fetching project [project_id=%d]', projectId);
	const response = await fetch(env.FRACTAL_SERVER_HOST + `/api/v1/project/${projectId}/`, {
		method: 'GET',
		credentials: 'include'
	});

	if (!response.ok) {
		logger.error('Unable to fetch project [project_id=%d]', projectId);
		await responseError(response);
	}

	return await response.json();
}

// DATASET ENDPOINTS

/**
 * Fetches all the project's datasets from the server
 * @param {typeof fetch} fetch
 * @param {number|string} projectId
 * @returns {Promise<Array<import('$lib/types').Dataset>>}
 */
export async function getProjectDatasets(fetch, projectId) {
	logger.debug('Retrieving project datasets [project_id=%d]', projectId);
	const response = await fetch(
		env.FRACTAL_SERVER_HOST + `/api/v1/project/${projectId}/dataset/?history=false`,
		{
			method: 'GET',
			credentials: 'include'
		}
	);

	if (!response.ok) {
		logger.error('Unable to fetch project datasets [project_id=%d]', projectId);
		await responseError(response);
	}

	/** @type {import('$lib/types').Dataset[]} */
	const datasets = await response.json();
	datasets.sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));
	return datasets;
}

/**
 * Fetches a project's dataset from the server
 * @param {typeof fetch} fetch
 * @param {number|string} projectId
 * @param {number|string} datasetId
 * @returns {Promise<import('$lib/types').Dataset>}
 */
export async function getDataset(fetch, projectId, datasetId) {
	logger.debug('Fetching dataset [dataset_id=%d] [project_id=%d]', datasetId, projectId);
	const response = await fetch(
		env.FRACTAL_SERVER_HOST + `/api/v1/project/${projectId}/dataset/${datasetId}/`,
		{
			method: 'GET',
			credentials: 'include'
		}
	);

	if (!response.ok) {
		logger.error('Unable to fetch dataset [dataset_id=%d] [project_id=%d]', datasetId, projectId);
		await responseError(response);
	}

	return await response.json();
}

// JOB ENDPOINTS

/**
 * Fetches the list of all the jobs belonging to the current user
 * @param {typeof fetch} fetch
 * @returns {Promise<Array<import('$lib/types').ApplyWorkflow>>}
 */
export async function getUserJobs(fetch) {
	logger.debug('Fetching user jobs');
	const response = await fetch(env.FRACTAL_SERVER_HOST + `/api/v1/job/?log=false`, {
		method: 'GET',
		credentials: 'include'
	});

	if (!response.ok) {
		logger.error('Unable to fetch user jobs');
		await responseError(response);
	}

	return await response.json();
}
