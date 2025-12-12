import { expect, test } from '@playwright/test';
import { setUploadFile, waitModal, waitModalClosed, waitPageLoading } from '../utils.js';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import os from 'os';

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
		const resource = await getResourceConfig(page);
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
		await page.getByRole('button', { name: 'Edit JSON' }).click();
		await expect(page.locator('textarea')).toHaveValue(/{/);
		const resource = await getResourceConfig(page);
		await page
			.locator('textarea')
			.fill(JSON.stringify({ ...resource, name: `${randomResourceName}-renamed` }));
		await page.getByRole('button', { name: 'Save' }).click();
		await expect(page.getByText('Resource updated')).toBeVisible();
	});

	await test.step('Deactivate and reactivate the resource', async () => {
		await page.getByRole('switch').click();
		let resource = await getResourceConfig(page);
		expect(resource.prevent_new_submissions).toEqual(false);
		const modal = await waitModal(page);
		await modal.getByRole('button', { name: 'Confirm' }).click();
		await waitModalClosed(page);
		resource = await getResourceConfig(page);
		expect(resource.prevent_new_submissions).toEqual(true);
		await page.getByRole('switch').click();
		await expect(page.getByRole('switch')).toBeEnabled();
		resource = await getResourceConfig(page);
		expect(resource.prevent_new_submissions).toEqual(false);
	});

	await test.step('Export the resource to file', async () => {
		await page.getByRole('link', { name: 'Resources' }).click();
		await waitPageLoading(page);
		const downloadPromise = page.waitForEvent('download');
		await page
			.getByRole('row', { name: `${randomResourceName}-renamed` })
			.getByRole('button', { name: 'Export to file' })
			.click();
		const download = await downloadPromise;
		const file = path.join(os.tmpdir(), download.suggestedFilename());
		await download.saveAs(file);
		const data = JSON.parse(fs.readFileSync(file).toString());
		expect(data.name).toEqual(`${randomResourceName}-renamed`);
		expect(data.type).toEqual('local');
	});

	await test.step('Delete the resource', async () => {
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

/**
 * @param {import('@playwright/test').Page} page
 */
async function getResourceConfig(page) {
	const text = await page.locator('textarea').inputValue();
	return JSON.parse(text);
}
