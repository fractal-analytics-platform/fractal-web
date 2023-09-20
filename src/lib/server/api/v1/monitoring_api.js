import { FRACTAL_SERVER_HOST } from '$env/static/private';
import { responseError } from '$lib/common/errors';

/**
 * Fetches the list of jobs from the server
 * @param {typeof fetch} fetch
 * @param {string} projectId
 * @param {string} jobId
 * @returns {Promise<*>}
 */
export async function getJob(fetch, projectId, jobId) {
	console.log('Fetching job from server');

	const response = await fetch(FRACTAL_SERVER_HOST + `/api/v1/project/${projectId}/job/${jobId}`, {
		method: 'GET',
		credentials: 'include',
		mode: 'cors'
	});

	if (response.ok) {
		return await response.json();
	}

	await responseError(response);
}
