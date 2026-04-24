import { checkApiError, getFractalCookie, getRandomName } from '../utils';

/**
 * @param {import('@playwright/test').Page} page
 * @param {number} projectId
 * @param {string|undefined} workflowName
 * @returns {Promise<{id: number, name: string}>}
 */
export async function createWorkflow(page, projectId, workflowName = undefined) {
	const name = workflowName ?? getRandomName();
	const response = await page.request.post(`/api/v2/project/${projectId}/workflow`, {
		headers: { Cookie: await getFractalCookie(page) },
		data: { name }
	});
	await checkApiError(response, 'Unable to create workflow');
	return await response.json();
}

/**
 * @param {import('@playwright/test').Page} page
 * @param {number} projectId
 * @param {number} workflowId
 */
export async function deleteWorkflow(page, projectId, workflowId) {
	const response = await page.request.delete(
		`/api/v2/project/${projectId}/workflow/${workflowId}`,
		{
			headers: { Cookie: await getFractalCookie(page) }
		}
	);
	await checkApiError(response, 'Unable to delete workflow');
}
