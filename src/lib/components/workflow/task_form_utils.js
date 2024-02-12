import { AlertError } from "$lib/common/errors";

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

	const updateArgs = requestData.args;
	const updateMeta = requestData.meta;

	console.log(`In updateFormEntry, requestData is ${JSON.stringify(requestData)}`);

	if (updateArgs) {
		return await updateWorkflowTaskArguments(
			projectId,
			workflowId,
			workflowTaskId,
			updateArgs
		);
	} else if (updateMeta) {
		return await updateWorkflowTaskMetadata(
			projectId,
			workflowId,
			workflowTaskId,
			updateMeta
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
		`/api/v1/project/${projectId}/workflow/${workflowId}/wftask/${workflowTaskId}`,
		{
			method: 'PATCH',
			credentials: 'include',
			headers,
			body: JSON.stringify(requestBody)
		}
	);

	const result = await response.json();
	if (response.ok) {
		console.log('workflow task arguments updated successfully', result);
		return result
	}

	throw new AlertError(result);
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
		`/api/v1/project/${projectId}/workflow/${workflowId}/wftask/${workflowTaskId}`,
		{
			method: 'PATCH',
			credentials: 'include',
			headers,
			body: JSON.stringify(requestBody)
		}
	);

	const result = await response.json();
	if (response.ok) {
		console.log('workflow task metadata updated successfully', result);
		return result
	}

	throw new AlertError(result);
}