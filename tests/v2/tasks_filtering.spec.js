import { expect, test } from './workflow_fixture.js';
import { selectSlimSelect, waitPageLoading } from '../utils.js';

test('Tasks filtering', async ({ page, workflow }) => {
	await page.waitForURL(workflow.url);
	await waitPageLoading(page);

	await test.step('Open add task to workflow modal and filter values', async () => {
		await page.getByRole('button', { name: 'Add task to workflow' }).click();
		const modal = page.locator('.modal.show');
		await modal.waitFor();
		await testFiltering(page);
	});

	await test.step('Open tasks page and filter values', async () => {
		await page.goto('/v2/tasks');
		await waitPageLoading(page);
		await testFiltering(page);
	});
});

/**
 * @param {import('@playwright/test').Page} page
 */
async function testFiltering(page) {
	const packageFilter = page.getByLabel('Select package');
	const modalityFilter = page.getByLabel('Select modality');
	const categoryFilter = page.getByLabel('Select category');
	const tagFilter = page.getByLabel('Select tag');

	const rows = page.getByRole('row');

	await selectSlimSelect(page, packageFilter, 'fractal-tasks-mock');
	await expect(rows).toHaveCount(16);
	await selectSlimSelect(page, modalityFilter, 'HCS');
	await expect(rows).toHaveCount(8);
	await selectSlimSelect(page, categoryFilter, 'Conversion');
	await expect(rows).toHaveCount(4);
	await expect(page.getByRole('row', { name: 'create_ome_zarr_compound' })).toBeVisible();

	await deselect(modalityFilter);
	await deselect(categoryFilter);
	await expect(rows).toHaveCount(16);

	await selectSlimSelect(page, tagFilter, 'Deep Learning');
	await expect(rows).toHaveCount(3);
	await expect(page.getByRole('row', { name: 'cellpose_segmentation' })).toBeVisible();

	await deselect(tagFilter);
	await expect(rows).toHaveCount(16);

	await search(page, 'mip', 'MIP_compound'); // search by task_name
	await search(page, 'deep', 'cellpose_segmentation'); // search by tag
	await search(page, 'my_type', 'generic_task_parallel'); // search by input type
	// search by modality
	await page.getByPlaceholder('Search...').fill('hcs');
	await expect(rows).toHaveCount(8);
}

/**
 * @param {import('@playwright/test').Locator} selector
 */
async function deselect(selector) {
	await selector.locator('.ss-deselect').click();
}

/**
 * @param {import('@playwright/test').Page} page
 * @param {string} query
 * @param {string} expectedTaskName
 */
async function search(page, query, expectedTaskName) {
	await page.getByPlaceholder('Search...').fill(query);
	await expect(page.getByRole('row')).toHaveCount(3);
	await expect(page.getByRole('row', { name: expectedTaskName })).toBeVisible();
	await page.getByPlaceholder('Search...').fill('');
	await expect(page.getByRole('row')).toHaveCount(16);
}
