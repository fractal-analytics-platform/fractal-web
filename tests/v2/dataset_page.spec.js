import { expect, test } from '@playwright/test';
import {
	createProject,
	login,
	logout,
	shareProjectByName,
	waitModalClosed,
	waitPageLoading
} from '../utils.js';
import { createTestUser } from './user_utils.js';
import { createDataset } from './dataset_utils.js';

// Reset storage state for this file to avoid being authenticated
test.use({ storageState: { cookies: [], origins: [] } });

/**
 * @param {import('@playwright/test').Page} page
 * @param {string} zarr_url
 * @param {(modal: import('@playwright/test').Locator) => Promise<void>} filtersFunction
 */
async function createImage(page, zarr_url, filtersFunction = async () => {}) {
	const newImageBtn = page.getByRole('button', { name: 'Add an image list entry' });
	await newImageBtn.waitFor();
	await newImageBtn.click();
	const modal = page.locator('.modal.show');
	await modal.waitFor();
	await modal.getByRole('textbox', { name: 'Zarr URL' }).fill(zarr_url);
	await filtersFunction(modal);
	await modal.getByRole('button', { name: 'Save' }).click();
	await waitModalClosed(page);
}

test('Dataset page', async ({ page }) => {
	const adminEmail = 'admin@fractal.xy';

	await test.step('Login as superuser', async () => {
		await login(page, adminEmail, '1234');
		await waitPageLoading(page);
	});

	const project1 = await createProject(page);
	const dataset1a = await createDataset(page, project1.id);
	const dataset1b = await createDataset(page, project1.id);

	await test.step('Test dataset pages as admin', async () => {
		await page.goto('/v2/datasets');

		const applyButton = page.getByRole('button', { name: 'Apply' });
		await expect(applyButton).toBeDisabled();
		const projectInput = page.getByRole('textbox', { name: 'Project name' });
		await expect(projectInput).toHaveValue('');
		await projectInput.fill(project1.name.toUpperCase());
		await applyButton.click();
		await waitPageLoading(page);

		const rows = page.getByRole('row');
		await expect(rows).toHaveCount(3);
		await expect(rows.nth(1)).toContainText(dataset1b.name);
		await expect(rows.nth(2)).toContainText(dataset1a.name);

		const row1 = rows.filter({ hasText: dataset1b.name });
		const row2 = rows.filter({ hasText: dataset1a.name });
		await expect(row1).toHaveCount(1);
		await expect(row2).toHaveCount(1);
		await expect(row1.getByRole('cell').nth(4)).toHaveText('0');
		await expect(row2.getByRole('cell').nth(4)).toHaveText('0');
	});

	await test.step('Add images to dataset1', async () => {
		const numberOfImages = 5;
		await page.goto(`/v2/projects/${project1.id}/datasets/${dataset1a.id}`);
		const randomSubfolder = Math.random().toString(36).substring(7);
		for (var i = 0; i < numberOfImages; i++) {
			await createImage(
				page,
				`/tmp/${dataset1a.zarrDir}/${randomSubfolder}${i}`,
				async function () {}
			);
		}
	});

	await test.step('Test dataset pages as admin', async () => {
		await page.goto('/v2/datasets');

		const applyButton = page.getByRole('button', { name: 'Apply' });
		await expect(applyButton).toBeDisabled();
		const projectInput = page.getByRole('textbox', { name: 'Project name' });
		await expect(projectInput).toHaveValue('');
		await projectInput.fill(project1.name.toUpperCase());
		await applyButton.click();
		await waitPageLoading(page);

		const rows = page.getByRole('row');
		await expect(rows).toHaveCount(3);
		await expect(rows.nth(1)).toContainText(dataset1b.name);
		await expect(rows.nth(2)).toContainText(dataset1a.name);

		const row1 = rows.filter({ hasText: dataset1b.name });
		const row2 = rows.filter({ hasText: dataset1a.name });
		await expect(row1).toHaveCount(1);
		await expect(row2).toHaveCount(1);
		await expect(row1.getByRole('cell').nth(4)).toHaveText('0');
		await expect(row2.getByRole('cell').nth(4)).toHaveText('5');
	});

	const userEmail = await createTestUser(page);
	await shareProjectByName(page, project1.name, userEmail, 'Read');

	await test.step('Login as other user and accept project', async () => {
		await logout(page, 'admin@fractal.xy');
		await login(page, userEmail, 'test');
		const alert = page.locator('.alert', { has: page.getByText(project1.name) });
		await expect(alert).toContainText(
			`User admin@fractal.xy wants to share project "${project1.name}" with you`
		);
		await alert.getByRole('button', { name: 'Accept' }).click();
		await expect(page.locator('.alert')).not.toBeVisible();
	});

	const project2 = await createProject(page);
	const dataset2 = await createDataset(page, project2.id);

	await test.step('Test dataset pages as test user', async () => {
		await page.goto('/v2/datasets');

		const rows = page.getByRole('row');
		await expect(rows).toHaveCount(4);
		await expect(rows.nth(1)).toContainText(dataset2.name);
		await expect(rows.nth(2)).toContainText(dataset1b.name);
		await expect(rows.nth(3)).toContainText(dataset1a.name);

		const row1 = rows.filter({ hasText: dataset2.name });
		const row2 = rows.filter({ hasText: dataset1b.name });
		const row3 = rows.filter({ hasText: dataset1a.name });
		await expect(row1).toHaveCount(1);
		await expect(row2).toHaveCount(1);
		await expect(row3).toHaveCount(1);
		await expect(row1.getByRole('cell').nth(4)).toHaveText('0');
		await expect(row2.getByRole('cell').nth(4)).toHaveText('0');
		await expect(row3.getByRole('cell').nth(4)).toHaveText('5');

		const applyButton = page.getByRole('button', { name: 'Apply' });
		await expect(applyButton).toBeDisabled();
		const resetButton = page.getByRole('button', { name: 'Reset' });
		await expect(resetButton).toBeDisabled();

		const datasetInput = page.getByRole('textbox', { name: 'Dataset name' });
		await expect(datasetInput).toHaveValue('');
		await datasetInput.fill(dataset1a.name.toUpperCase());

		await applyButton.click();
		await waitPageLoading(page);

		await expect(rows).toHaveCount(2);
		await expect(rows.nth(1)).toContainText(dataset1a.name);
		await expect(rows.nth(1).getByRole('cell').nth(4)).toHaveText('5');

		await resetButton.click();
		await waitPageLoading(page);

		await expect(rows).toHaveCount(4);

		await page.getByLabel('Only owned').check();
		await applyButton.click();
		await expect(rows).toHaveCount(2);
		await expect(rows.nth(1)).toContainText(dataset2.name);
	});
});
