import { expect, test } from '@playwright/test';
import { setUploadFile, waitModal, waitModalClosed, waitPageLoading } from '../utils.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const resourceFile = path.join(__dirname, '..', 'data', 'resource.json');

const randomResourceName = `${Math.random().toString(36).substring(7)} resource`;
const randomProfileName = `${Math.random().toString(36).substring(7)} profile`;

test('Create, update and delete a profile', async ({ page }) => {
	await test.step('Create a new resource', async () => {
		await page.goto('/v2/admin/resources/create');
		await waitPageLoading(page);
		await setUploadFile(page, 'Load from file', resourceFile);
		await expect(page.locator('textarea')).toHaveValue(/{/);
		const text = await page.locator('textarea').inputValue();
		const resource = JSON.parse(/**@type {string} */ (text));
		await page.locator('textarea').fill(JSON.stringify({ ...resource, name: randomResourceName }));
		await page.getByRole('button', { name: 'Create resource' }).click();
		await page.waitForURL(/\/v2\/admin\/resources$/);
		await waitPageLoading(page);
	});

	await test.step('Open resource profiles', async () => {
		await page
			.getByRole('row', { name: randomResourceName })
			.getByRole('link', { name: 'Profiles' })
			.click();
		await page.waitForURL(/\/v2\/admin\/resources\/\d+\/profiles$/);
		await waitPageLoading(page);
	});

	await test.step('Create new profile', async () => {
		await page.getByRole('link', { name: 'New profile' }).click();
		await page.waitForURL(/\/v2\/admin\/resources\/\d+\/profiles\/create$/);
		await waitPageLoading(page);
		await page.getByRole('textbox', { name: 'Profile name' }).fill(randomProfileName);
		await page.getByRole('button', { name: 'Save' }).click();
		await page.waitForURL(/\/v2\/admin\/resources\/\d+\/profiles$/);
		await waitPageLoading(page);
	});

	await test.step('Open profile page', async () => {
		await page
			.getByRole('row', { name: randomProfileName })
			.getByRole('link', { name: 'Info' })
			.click();
		await page.waitForURL(/\/v2\/admin\/resources\/\d+\/profiles\/\d+$/);
		await waitPageLoading(page);
		await expect(page.getByRole('row', { name: randomProfileName })).toBeVisible();
	});

	await test.step('Edit profile', async () => {
		await page.getByRole('link', { name: 'Edit' }).click();
		await page.getByRole('textbox', { name: 'Profile name' }).fill(`${randomProfileName}-renamed`);
		await page.getByRole('button', { name: 'Save' }).click();
		await expect(page.getByText('Profile successfully updated')).toBeVisible();
	});

	await test.step('Delete profile', async () => {
		await page.getByRole('link', { name: 'Profiles' }).click();
		await page.waitForURL(/\/v2\/admin\/resources\/\d+\/profiles$/);
		await waitPageLoading(page);
		await page
			.getByRole('row', { name: `${randomProfileName}-renamed` })
			.getByRole('button', { name: 'Delete' })
			.click();
		const modal = await waitModal(page);
		await modal.getByRole('button', { name: 'Confirm' }).click();
		await waitModalClosed(page);
		await expect(page.getByRole('row', { name: `${randomProfileName}-renamed` })).not.toBeVisible();
	});

	await test.step('Delete test resource', async () => {
		await page.getByRole('link', { name: 'Resources' }).click();
		await page.waitForURL(/\/v2\/admin\/resources$/);
		await waitPageLoading(page);
		await page
			.getByRole('row', { name: randomResourceName })
			.getByRole('button', { name: 'Delete' })
			.click();
		const modal = await waitModal(page);
		await modal.getByRole('button', { name: 'Confirm' }).click();
		await waitModalClosed(page);
		await expect(page.getByRole('row', { name: randomResourceName })).not.toBeVisible();
	});
});
