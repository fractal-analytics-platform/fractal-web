import { checkApiError, getFractalCookie, getRandomName } from '../utils';

/**
 * @param {import('@playwright/test').Page} page
 * @param {number} projectId
 * @returns {Promise<{id: number, name: string, zarr_dir: string}>}
 */
export async function createDataset(page, projectId) {
	const name = getRandomName();
	const data = {
		name,
		project_dir: '/tmp',
		zarr_subfolder: `playwright/datasets/${name}`
	};
	const response = await page.request.post(`/api/v2/project/${projectId}/dataset`, {
		headers: { Cookie: await getFractalCookie(page) },
		data
	});
	await checkApiError(response, 'Unable to create dataset');
	return await response.json();
}
