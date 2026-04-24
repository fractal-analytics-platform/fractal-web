import { checkApiError, getFractalCookie, getRandomName } from '../utils';

/**
 * @param {import('@playwright/test').Page} page
 * @returns {Promise<{id: number, name: string}>}
 */
export async function createProject(page) {
	const name = getRandomName();
	const response = await page.request.post(`/api/v2/project`, {
		headers: { Cookie: await getFractalCookie(page) },
		data: { name }
	});
	await checkApiError(response, 'Unable to create project');
	return await response.json();
}

/**
 * @param {import('@playwright/test').Page} page
 * @param {number} id
 */
export async function deleteProject(page, id) {
	const response = await page.request.delete(`/api/v2/project/${id}`, {
		headers: { Cookie: await getFractalCookie(page) }
	});
	await checkApiError(response, 'Unable to delete project');
}
