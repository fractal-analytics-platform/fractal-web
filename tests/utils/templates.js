import { checkApiError, getFractalCookie, getRandomName } from './utils';

/**
 * @param {import('@playwright/test').Page} page
 * @param {object[]} tasksList
 * @returns {Promise<{id: number, name: string}>}
 */
export async function createTemplate(page, tasksList) {
	const name = getRandomName();
	const response = await page.request.post(`/api/v2/workflow-template/import`, {
		headers: { Cookie: await getFractalCookie(page) },
		data: {
			name: name,
			version: 1,
			description: 'test',
			data: {
				name: name,
				description: null,
				task_list: tasksList
			}
		}
	});

	await checkApiError(response, 'Unable to create template');
	return await response.json();
}
