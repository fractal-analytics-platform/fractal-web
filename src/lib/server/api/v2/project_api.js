import { env } from '$env/dynamic/private';
import { responseError } from '$lib/common/errors.server';
import { getLogger } from '$lib/server/logger.js';

const logger = getLogger('projects API [v2]');

// PROJECT ENDPOINTS

/**
 * Fetches the list of projects from the server
 * @param {typeof fetch} fetch
 * @param {boolean} isOwner
 * @returns {Promise<import('fractal-components/types/api').ProjectV2[]>}
 */
export async function listProjects(fetch, isOwner) {
	logger.debug('Fetching the list of projects');
	const response = await fetch(`${env.FRACTAL_SERVER_HOST}/api/v2/project/?is_owner=${isOwner}`, {
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
 * @returns {Promise<import('fractal-components/types/api').ProjectV2>}
 */
export async function getProject(fetch, projectId) {
	logger.debug('Fetching project [project_id=%d]', projectId);
	const response = await fetch(env.FRACTAL_SERVER_HOST + `/api/v2/project/${projectId}/`, {
		method: 'GET',
		credentials: 'include'
	});

	if (!response.ok) {
		logger.error('Unable to fetch project [project_id=%d]', projectId);
		await responseError(response);
	}

	return await response.json();
}

/**
 * Fetches project guests from the server
 * @param {typeof fetch} fetch
 * @param {string} projectId
 * @returns {Promise<import('fractal-components/types/api').ProjectGuest>}
 */
export async function getProjectGuests(fetch, projectId) {
	logger.debug('Fetching project guests [project_id=%d]', projectId);
	const response = await fetch(env.FRACTAL_SERVER_HOST + `/api/v2/project/${projectId}/guest/`, {
		method: 'GET',
		credentials: 'include'
	});

	if (!response.ok) {
		logger.error('Unable to fetch project guests [project_id=%d]', projectId);
		await responseError(response);
	}

	return await response.json();
}

/**
 * Fetches project invitations from the server
 * @param {typeof fetch} fetch
 * @returns {Promise<import('fractal-components/types/api').ProjectInvitation>}
 */
export async function getProjectInvitations(fetch) {
	logger.debug('Fetching project invitations');
	const response = await fetch(env.FRACTAL_SERVER_HOST + `/api/v2/project/invitation/`, {
		method: 'GET',
		credentials: 'include'
	});

	if (!response.ok) {
		logger.error('Unable to fetch project invitations');
		await responseError(response);
	}

	return await response.json();
}

// DATASET ENDPOINTS

/**
 * Fetches all the project's datasets from the server
 * @param {typeof fetch} fetch
 * @param {number|string} projectId
 * @returns {Promise<Array<import('fractal-components/types/api').DatasetV2>>}
 */
export async function getProjectDatasets(fetch, projectId) {
	logger.debug('Retrieving project datasets [project_id=%d]', projectId);
	const response = await fetch(
		env.FRACTAL_SERVER_HOST + `/api/v2/project/${projectId}/dataset/?history=false`,
		{
			method: 'GET',
			credentials: 'include'
		}
	);

	if (!response.ok) {
		logger.error('Unable to fetch project datasets [project_id=%d]', projectId);
		await responseError(response);
	}

	/** @type {import('fractal-components/types/api').DatasetV2[]} */
	const datasets = await response.json();
	datasets.sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));
	return datasets;
}

/**
 * Fetches a project's dataset from the server
 * @param {typeof fetch} fetch
 * @param {number|string} projectId
 * @param {number|string} datasetId
 * @returns {Promise<import('fractal-components/types/api').DatasetV2>}
 */
export async function getDataset(fetch, projectId, datasetId) {
	logger.debug('Retrieving dataset [dataset_id=%d] [project_id=%d]', datasetId, projectId);
	const response = await fetch(
		env.FRACTAL_SERVER_HOST + `/api/v2/project/${projectId}/dataset/${datasetId}/`,
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
 * @returns {Promise<Array<import('fractal-components/types/api').ApplyWorkflowV2>>}
 */
export async function getUserJobs(fetch) {
	logger.debug('Fetching user jobs');
	const response = await fetch(env.FRACTAL_SERVER_HOST + `/api/v2/job/?log=false`, {
		method: 'GET',
		credentials: 'include'
	});

	if (!response.ok) {
		logger.error('Unable to fetch user jobs');
		await responseError(response);
	}

	return await response.json();
}
