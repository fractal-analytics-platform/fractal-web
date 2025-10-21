import { expect, test } from '@playwright/test';
import { setUploadFile, waitModal, waitModalClosed, waitPageLoading } from '../utils.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const resourceFile = path.join(__dirname, '..', 'data', 'resource.json');

const randomResourceName = `${Math.random().toString(36).substring(7)} resource`;
const randomProfileName = `${Math.random().toString(36).substring(7)} profile`;

test('Associate a profile to a user', async ({ page }) => {
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

	const profileUrl =
		(await page
			.getByRole('row', { name: randomProfileName })
			.getByRole('link', { name: 'Info' })
			.getAttribute('href')) || '';

	const randomEmail = Math.random().toString(36).substring(7) + '@example.com';

	await test.step('Create test user and associate it with new profile', async () => {
		await page.goto('/v2/admin/users/register');
		await waitPageLoading(page);
		await page.getByRole('textbox', { name: 'E-mail' }).fill(randomEmail);
		await page.getByLabel('Password', { exact: true }).fill('test');
		await page.getByLabel('Confirm password').fill('test');
		await page.getByRole('combobox', { name: 'Select resource' }).selectOption(randomResourceName);
		await page.getByRole('combobox', { name: 'Select profile' }).selectOption(randomProfileName);
		await page.getByRole('button', { name: 'Save' }).click();
		await page.waitForURL(/\/v2\/admin\/users\/\d+\/edit/);
		await waitPageLoading(page);
	});

	await test.step('Go to the profile page and check the listed users', async () => {
		await page.goto(profileUrl);
		await waitPageLoading(page);
		await page.getByRole('button', { name: 'Users (1)' }).click();
		const userLink = page.getByRole('link', { name: randomEmail });
		await expect(userLink).toBeVisible();
		await userLink.click();
		await page.waitForURL(/\/v2\/admin\/users\/\d+$/);
		await waitPageLoading(page);
	});

	await test.step('Go to user editing page and verify the selected profile', async () => {
		await page.getByRole('link', { name: 'Edit' }).click();
		await waitPageLoading(page);
		await expect(
			page
				.getByRole('combobox', { name: 'Select resource' })
				.getByRole('option', { selected: true })
		).toHaveText(randomResourceName);
		await expect(
			page.getByRole('combobox', { name: 'Select profile' }).getByRole('option', { selected: true })
		).toHaveText(randomProfileName);
	});

	await test.step('Unset the profile', async () => {
		await page.getByRole('combobox', { name: 'Select profile' }).selectOption('Select profile...');
		await page.getByRole('button', { name: 'Save' }).click();
		await expect(page.getByText('User successfully updated')).toBeVisible();
	});

	await test.step('Reload the page and verify that no profile is selected', async () => {
		await page.reload();
		await waitPageLoading(page);
		await expect(
			page
				.getByRole('combobox', { name: 'Select resource' })
				.getByRole('option', { selected: true })
		).toHaveText('Select resource...');
		await expect(
			page.getByRole('combobox', { name: 'Select profile' }).getByRole('option', { selected: true })
		).toHaveText('Select profile...');
	});

	await test.step('Go to the profile page and check the listed users', async () => {
		await page.goto(profileUrl);
		await waitPageLoading(page);
		await expect(page.getByText('There are no users associated with this profile')).toBeVisible();
	});

	await test.step('Delete profile', async () => {
		await page.goto('/v2/admin/resources');
		await waitPageLoading(page);
		await page
			.getByRole('row', { name: randomResourceName })
			.getByRole('link', { name: 'Profiles' })
			.click();
		await page.waitForURL(/\/v2\/admin\/resources\/\d+\/profiles$/);
		await waitPageLoading(page);
		await page
			.getByRole('row', { name: randomProfileName })
			.getByRole('button', { name: 'Delete' })
			.click();
		const modal = await waitModal(page);
		await modal.getByRole('button', { name: 'Confirm' }).click();
		await waitModalClosed(page);
		await expect(page.getByRole('row', { name: randomProfileName })).not.toBeVisible();
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
