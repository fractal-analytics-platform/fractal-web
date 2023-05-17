import { FRACTAL_SERVER_HOST } from '$env/static/private';
import { PostResourceException } from '$lib/common/errors';

// PROJECT ENDPOINTS

/**
 * Fetches the list of projects from the server
 * @param fetch
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
 * Creates a new project in the server
 * @param fetch
 * @param data
 * @returns {Promise<*>}
 */
export async function createProject(fetch, data) {
	// Data is a FormData object

	const requestData = {
		name: data.get('projectName')
	};

	const headers = new Headers();
	headers.set('Content-Type', 'application/json');

	const response = await fetch(FRACTAL_SERVER_HOST + '/api/v1/project/', {
		method: 'POST',
		credentials: 'include',
		mode: 'cors',
		headers,
		body: JSON.stringify(requestData)
	});

	if (response.ok) {
		return await response.json();
	}

	throw new PostResourceException(await response.json());
}

/**
 * Fetches a project from the server
 * @param fetch
 * @param projectId
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

	throw new Error('The client was not able to fetch the project');
}

/**
 * Updates a project in the server
 * @param fetch
 * @param projectId
 * @param formData
 * @returns {Promise<*>}
 */
export async function updateProject(fetch, projectId, formData) {
	const requestBody = {
		name: formData.get('projectName')
	};

	const headers = new Headers();
	headers.set('Content-Type', 'application/json');

	const response = await fetch(FRACTAL_SERVER_HOST + `/api/v1/project/${projectId}`, {
		method: 'PATCH',
		credentials: 'include',
		mode: 'cors',
		headers,
		body: JSON.stringify(requestBody)
	});

	if (response.ok) {
		return await response.json();
	}

	throw new PostResourceException(await response.json());
}

/**
 * Deletes a project from the server
 * @param fetch
 * @param projectId
 * @returns {Promise<*>}
 */
export async function deleteProject(fetch, projectId) {
	return await fetch(FRACTAL_SERVER_HOST + `/api/v1/project/${projectId}`, {
		method: 'DELETE',
		credentials: 'include',
		mode: 'cors'
	});
}

// DATASET ENDPOINTS

/**
 * Creates a project's dataset in the server
 * @param fetch
 * @param projectId
 * @param formData
 * @returns {Promise<*>}
 */
export async function createDataset(fetch, projectId, formData) {
	const requestData = {
		name: formData.get('datasetName'),
		// type: "", Currently is not included the type to create a dataset
		meta: {},
		read_only: formData.get('datasetReadonly') ? true : false
	};

	const headers = new Headers();
	headers.set('Content-Type', 'application/json');

	const response = await fetch(FRACTAL_SERVER_HOST + `/api/v1/project/${projectId}/dataset/`, {
		method: 'POST',
		credentials: 'include',
		mode: 'cors',
		headers,
		body: JSON.stringify(requestData)
	});

	if (response.ok) {
		return await response.json();
	}

	throw new PostResourceException(await response.json());
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

	throw new Error('The client was not able to fetch the dataset');
}

/**
 * Updates a project's dataset in the server
 * @param fetch
 * @param projectId
 * @param datasetId
 * @param formData
 * @returns {Promise<*>}
 */
export async function updateDataset(fetch, projectId, datasetId, formData) {
	const requestBody = {
		name: formData.get('name'),
		type: formData.get('type'),
		read_only: formData.get('read_only') ? true : false
	};

	// Should prevent requestBody null or empty values
	Object.keys(requestBody).forEach((key) => {
		if (requestBody[key] === null || requestBody[key] === '') {
			delete requestBody[key];
		}
	});

	const headers = new Headers();
	headers.set('Content-Type', 'application/json');

	const response = await fetch(
		FRACTAL_SERVER_HOST + `/api/v1/project/${projectId}/dataset/${datasetId}`,
		{
			method: 'PATCH',
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
 * Deletes a project's dataset from the server
 * @param fetch
 * @param projectId
 * @param datasetId
 * @returns {Promise<boolean>}
 */
export async function deleteDataset(fetch, projectId, datasetId) {
	const response = await fetch(
		FRACTAL_SERVER_HOST + `/api/v1/project/${projectId}/dataset/${datasetId}`,
		{
			method: 'DELETE',
			credentials: 'include',
			mode: 'cors'
		}
	);

	if (response.ok) {
		return true;
	}

	throw new Error('The dataset was not deleted by the server');
}

// DATASET RESOURCE ENDPOINTS

/**
 * Creates a project's dataset resource in the server
 * @param fetch
 * @param projectId
 * @param datasetId
 * @param formData
 * @returns {Promise<*>}
 */
export async function createDatasetResource(fetch, projectId, datasetId, formData) {
	const requestBody = {
		path: formData.get('source')
	};

	const headers = new Headers();
	headers.set('Content-Type', 'application/json');

	const response = await fetch(
		FRACTAL_SERVER_HOST + `/api/v1/project/${projectId}/dataset/${datasetId}/resource/`,
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
 * Deletes a project's dataset resource from the server
 * @param fetch
 * @param projectId
 * @param datasetId
 * @param resourceId
 * @returns {Promise<boolean>}
 */
export async function deleteDatasetResource(fetch, projectId, datasetId, resourceId) {
	const response = await fetch(
		FRACTAL_SERVER_HOST +
			`/api/v1/project/${projectId}/dataset/${datasetId}/resource/${resourceId}`,
		{
			method: 'DELETE',
			credentials: 'include',
			mode: 'cors'
		}
	);

	if (response.ok) {
		return true;
	}

	throw new Error('The client was not able to delete dataset resource');
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

/**
 * Request the import of a project's workflow to the server
 * @param fetch
 * @param projectId
 * @param workflowMetadata
 * @returns {Promise<*>}
 */
export async function importWorkflow(fetch, projectId, workflowMetadata) {
	const headers = new Headers();
	headers.set('Content-Type', 'application/json');

	const response = await fetch(
		FRACTAL_SERVER_HOST + `/api/v1/project/${projectId}/workflow/import/`,
		{
			method: 'POST',
			credentials: 'include',
			mode: 'cors',
			headers,
			body: JSON.stringify(workflowMetadata)
		}
	);

	if (response.ok) {
		// Return a workflow item
		return await response.json();
	}

	throw new PostResourceException(await response.json());
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
