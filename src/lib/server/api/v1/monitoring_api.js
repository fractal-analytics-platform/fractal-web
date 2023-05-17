import { FRACTAL_SERVER_HOST } from '$env/static/private';

/**
 * Fetches the list of jobs from the server
 * @param fetch
 * @param projectId
 * @param jobId
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

	throw new Error('The client was not able to retrieve the job');
}

/**
 * Requests the server to stop a job execution
 * @param fetch
 * @param projectId
 * @param jobId
 * @returns {Promise<*>}
 */
export async function stopJob(fetch, projectId, jobId) {
	console.log('Requesting stop job execution from server');

	const response = await fetch(FRACTAL_SERVER_HOST + `/api/v1/project/${projectId}/job/${jobId}/stop/`, {
		method: 'GET',
		credentials: 'include',
		mode: 'cors'
	});

	if (response.ok) {
		return await response.json();
	}

	throw new Error('The server was not able to stop the job');
}