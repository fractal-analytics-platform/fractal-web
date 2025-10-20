import { expect, test } from '@playwright/test';
import { setUploadFile, waitModal, waitModalClosed, waitPageLoading } from '../utils.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const resourceFile = path.join(__dirname, '..', 'data', 'resource.json');

const randomResourceName = `${Math.random().toString(36).substring(7)} resource`;

test('Create, update and delete a resource', async ({ page }) => {
	await test.step('Open the admin area', async () => {
		await page.goto('/v2/admin');
		await waitPageLoading(page);
	});

	await test.step('Open the new resource page', async () => {
		await page.getByRole('link', { name: 'Resources' }).click();
		await waitPageLoading(page);
		await page.getByRole('link', { name: 'New resource' }).click();
		await waitPageLoading(page);
	});

	await test.step('Create a new resource', async () => {
		await setUploadFile(page, 'Load from file', resourceFile);
		await expect(page.locator('textarea')).toHaveValue(/{/);
		const text = await page.locator('textarea').inputValue();
		const resource = JSON.parse(/**@type {string} */ (text));
		await page.locator('textarea').fill(JSON.stringify({ ...resource, name: randomResourceName }));
		await page.getByRole('button', { name: 'Create resource' }).click();
		await page.waitForURL(/\/v2\/admin\/resources$/);
		await waitPageLoading(page);
	});

	await test.step('Open the resource', async () => {
		await page
			.getByRole('row', { name: randomResourceName })
			.getByRole('link', { name: 'Info' })
			.click();
		await page.waitForURL(/\/v2\/admin\/resources\/\d+$/);
		await waitPageLoading(page);
		await expect(page.getByText('timestamp_created')).toBeVisible();
	});

	await test.step('Update the resource', async () => {
		await page.getByRole('link', { name: 'Edit' }).click();
		await page.waitForURL(/\/v2\/admin\/resources\/\d+\/edit$/);
		await waitPageLoading(page);
		await expect(page.locator('textarea')).toHaveValue(/{/);
		const text = await page.locator('textarea').inputValue();
		const resource = JSON.parse(/**@type {string} */ (text));
		await page
			.locator('textarea')
			.fill(JSON.stringify({ ...resource, name: `${randomResourceName}-renamed` }));
		await page.getByRole('button', { name: 'Save' }).click();
		await expect(page.getByText('Resource updated')).toBeVisible();
	});

	await test.step('Delete the resource', async () => {
		await page.getByRole('link', { name: 'Resources' }).click();
		await waitPageLoading(page);
		await page
			.getByRole('row', { name: `${randomResourceName}-renamed` })
			.getByRole('button', { name: 'Delete' })
			.click();
		const modal = await waitModal(page);
		await modal.getByRole('button', { name: 'Confirm' }).click();
		await waitModalClosed(page);
		await expect(
			page.getByRole('row', { name: `${randomResourceName}-renamed` })
		).not.toBeVisible();
	});
});
