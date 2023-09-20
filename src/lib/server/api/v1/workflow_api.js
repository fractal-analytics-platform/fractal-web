import { FRACTAL_SERVER_HOST } from '$env/static/private';
import { PostResourceException, responseError } from '$lib/common/errors';

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
 * Exports a project's workflow from the server
 * @param fetch
 * @param projectId
 * @param workflowId
 * @returns {Promise<*>}
 */
export async function exportWorkflow(fetch, projectId, workflowId) {
	const response = await fetch(
		FRACTAL_SERVER_HOST + `/api/v1/project/${projectId}/workflow/${workflowId}/export`,
		{
			method: 'GET',
			credentials: 'include',
			mode: 'cors'
		}
	);

	if (response.ok) {
		return await response.json();
	}

	throw new Error('The client was not able to retrieve the workflow export data from the server');
}

/**
 * Deletes a project's workflow task from the server
 * @param fetch
 * @param projectId
 * @param workflowId
 * @param workflowTaskId
 * @returns {Promise<boolean>}
 */
export async function deleteWorkflowTask(fetch, projectId, workflowId, workflowTaskId) {
	const response = await fetch(
		FRACTAL_SERVER_HOST +
			`/api/v1/project/${projectId}/workflow/${workflowId}/wftask/${workflowTaskId}`,
		{
			method: 'DELETE',
			credentials: 'include',
			mode: 'cors'
		}
	);

	if (response.ok) return true;

	throw new Error('The client was not able to delete the workflow task');
}

/**
 * Requests the server to apply a project's workflow (i.e. run it)
 * @param fetch
 * @param projectId
 * @param workflowId
 * @param formData
 * @returns {Promise<*>}
 */
export async function applyWorkflow(fetch, projectId, workflowId, formData) {
	const requestBody = {};

	// Set input/output dataset (both required)
	const inputDatasetId = formData.get('inputDataset');
	const outputDatasetId = formData.get('outputDataset');
	console.log('inputDatasetId', inputDatasetId);
	console.log('outputDatasetId', outputDatasetId);

	// Set worker_init if provided
	if (formData.get('workerInit')) {
		requestBody.worker_init = formData.get('workerInit');
	}
	if (formData.get('firstTaskIndex')) {
		requestBody.first_task_index = formData.get('firstTaskIndex');
	}
	if (formData.get('lastTaskIndex')) {
		requestBody.last_task_index = formData.get('lastTaskIndex');
	}

	const headers = new Headers();
	headers.set('Content-Type', 'application/json');

	const response = await fetch(
		FRACTAL_SERVER_HOST +
		`/api/v1/project/${projectId}/workflow/${workflowId}/apply/?input_dataset_id=${inputDatasetId}&output_dataset_id=${outputDatasetId}`,
		{
			method: 'POST',
			credentials: 'include',
			mode: 'cors',
			headers,
			body: JSON.stringify(requestBody)
		}
	);

	if (response.ok) {
		return await response.json();
	}

	throw new PostResourceException(await response.json());
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
