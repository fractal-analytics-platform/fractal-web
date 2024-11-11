import { AlertError, getAlertErrorFromResponse } from "$lib/common/errors";

/**
 * Updates the workflow task properties.
 * @param {string} projectId 
 * @param {number} workflowId 
 * @param {number} workflowTaskId 
 * @param {any} updatingWorkflowTaskProperties 
 * @param {string} groupName
 * @returns 
 */
export async function updateFormEntry(
	projectId,
	workflowId,
	workflowTaskId,
	updatingWorkflowTaskProperties,
	groupName
) {
	const requestData = {};
	requestData[groupName] = updatingWorkflowTaskProperties;

	console.log(`In updateFormEntry, requestData is ${JSON.stringify(requestData)}`);

	if (groupName === 'args_non_parallel' || groupName === 'args_parallel') {
		return await updateWorkflowTaskArguments(
			projectId,
			workflowId,
			workflowTaskId,
			updatingWorkflowTaskProperties
		);
	} else if (groupName === 'meta') {
		return await updateWorkflowTaskMetadata(
			projectId,
			workflowId,
			workflowTaskId,
			updatingWorkflowTaskProperties
		);
	}
	throw new AlertError('Invalid request data: args or meta are required');
}

/**
 * Updates a project's workflow task in the server
 * @param {string} projectId
 * @param {number} workflowId
 * @param {number} workflowTaskId
 * @param {any} args
 * @returns {Promise<*>}
 */
async function updateWorkflowTaskArguments(
	projectId,
	workflowId,
	workflowTaskId,
	args
) {
	const requestBody = {
		args: args
	};

	const headers = new Headers();
	headers.set('Content-Type', 'application/json');

	const response = await fetch(
		`/api/v2/project/${projectId}/workflow/${workflowId}/wftask/${workflowTaskId}`,
		{
			method: 'PATCH',
			credentials: 'include',
			headers,
			body: JSON.stringify(requestBody)
		}
	);

	if (response.ok) {
		console.log('workflow task arguments updated successfully');
		return await response.json();
	}

	throw await getAlertErrorFromResponse(response);
}

/**
 * Updates a project's workflow task in the server
 * @param {string} projectId
 * @param {number} workflowId
 * @param {number} workflowTaskId
 * @param {any} meta
 * @returns {Promise<*>}
 */
async function updateWorkflowTaskMetadata(
	projectId,
	workflowId,
	workflowTaskId,
	meta
) {
	const requestBody = {
		meta: meta
	};

	const headers = new Headers();
	headers.set('Content-Type', 'application/json');

	const response = await fetch(
		`/api/v2/project/${projectId}/workflow/${workflowId}/wftask/${workflowTaskId}`,
		{
			method: 'PATCH',
			credentials: 'include',
			headers,
			body: JSON.stringify(requestBody)
		}
	);

	if (response.ok) {
		console.log('workflow task metadata updated successfully');
		return await response.json()
	}

	throw await getAlertErrorFromResponse(response);
}