import { FRACTAL_SERVER_HOST } from '$env/static/private';
import { responseError } from '$lib/common/errors';

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
 * Downloads a project's workflow job log as zip file
 * @param fetch
 * @param projectId
 * @param workflowJobId
 * @returns {Promise<*|Blob>}
 */
export async function downloadWorkflowJobLog(fetch, projectId, workflowJobId) {
	const response = await fetch(
		FRACTAL_SERVER_HOST + `/api/v1/project/${projectId}/job/${workflowJobId}/download/`,
		{
			method: 'GET',
			credentials: 'include',
			mode: 'cors'
		}
	);

	if (response.ok) {
		// The API uses a StreamResponse to stream the zip file to the client
		// Get a stream reader from the body
		const reader = response.body.getReader();
		// Read the stream and create a blob
		const readableStream = new ReadableStream({
			start(controller) {
				return pump();
				function pump() {
					return reader.read().then(({ done, value }) => {
						// When no more data needs to be consumed, close the stream
						if (done) {
							controller.close();
							return;
						}
						// Enqueue the next data chunk into our target stream
						controller.enqueue(value);
						return pump();
					});
				}
			}
		});
		// Create a blob from the stream
		const blob = await new Response(readableStream).blob();
		return blob;
	}

	throw new Error('The client was not able to retrieve the workflow job log from the server');
}
