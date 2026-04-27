import { expect, test } from '@playwright/test';
import {
	closeModal,
	login,
	setUploadFile,
	waitModal,
	waitPageLoading
} from '../../../utils/utils.js';
import path from 'path';
import { fileURLToPath } from 'url';
import { createProject } from '../../../utils/v2/project.js';
import { createDataset } from '../../../utils/v2/dataset.js';
import { createTestUser } from '../../../utils/v2/user.js';

// Reset storage state for this file to avoid being authenticated
test.use({ storageState: { cookies: [], origins: [] } });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const resourceFile = path.join(__dirname, '..', 'data', 'resource.json');

const randomResourceName = `${Math.random().toString(36).substring(7)} resource`;
const randomProfileName1 = `${Math.random().toString(36).substring(7)} profile`;
const randomProfileName2 = `${Math.random().toString(36).substring(7)} profile`;
const randomProjectDir = `/${Math.random().toString(36).substring(7)}`;

test('Admin page for projects', async ({ page }) => {
	const adminEmail = 'admin@fractal.xy';

	await test.step('Login as superuser', async () => {
		await login(page, adminEmail, '1234');
		await waitPageLoading(page);
	});

	const project = await createProject(page);
	const dataset = await createDataset(page, project.id);

	await test.step('Create Profile2 for Resource1', async () => {
		await page.goto('/v2/admin/resources');
		await waitPageLoading(page);
		await page
			.getByRole('row', { name: 'Local resource' })
			.getByRole('link', { name: 'Profiles' })
			.click();
		await page.waitForURL(/\/v2\/admin\/resources\/\d+\/profiles$/);
		await waitPageLoading(page);
		await page.getByRole('link', { name: 'New profile' }).click();
		await page.waitForURL(/\/v2\/admin\/resources\/\d+\/profiles\/create$/);
		await waitPageLoading(page);
		await page.getByRole('textbox', { name: 'Profile name' }).fill(randomProfileName1);
		await page.getByRole('button', { name: 'Save' }).click();
		await page.waitForURL(/\/v2\/admin\/resources\/\d+\/profiles$/);
		await waitPageLoading(page);
	});

	await test.step('Create Resource 2', async () => {
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

	await test.step('Create Profile3 for Resource2', async () => {
		await page.goto('/v2/admin/resources');
		await waitPageLoading(page);
		await page
			.getByRole('row', { name: randomResourceName })
			.getByRole('link', { name: 'Profiles' })
			.click();
		await page.waitForURL(/\/v2\/admin\/resources\/\d+\/profiles$/);
		await waitPageLoading(page);
		await page.getByRole('link', { name: 'New profile' }).click();
		await page.waitForURL(/\/v2\/admin\/resources\/\d+\/profiles\/create$/);
		await waitPageLoading(page);
		await page.getByRole('textbox', { name: 'Profile name' }).fill(randomProfileName2);
		await page.getByRole('button', { name: 'Save' }).click();
		await page.waitForURL(/\/v2\/admin\/resources\/\d+\/profiles$/);
		await waitPageLoading(page);
	});

	const { email: userEmail1 } = await createTestUser(page);
	const { email: userEmail2, id: userId2 } = await createTestUser(page);

	await test.step('Associate User2 to Profile2', async () => {
		await page.goto(`/v2/admin/users/${userId2}/edit`);
		await waitPageLoading(page);
		await page.getByRole('combobox', { name: 'Select resource' }).selectOption('Local resource');
		await page.getByRole('combobox', { name: 'Select profile' }).selectOption(randomProfileName1);
		await page.getByRole('button', { name: 'Save' }).click();
		await page.waitForURL(/\/v2\/admin\/users\/\d+\/edit/);
		await waitPageLoading(page);
	});

	const { email: userEmail3, id: userId3 } = await createTestUser(page);
	await test.step('Associate User3 to Profile3', async () => {
		await page.goto(`/v2/admin/users/${userId3}/edit`);
		await waitPageLoading(page);
		await page.getByRole('combobox', { name: 'Select resource' }).selectOption(randomResourceName);
		await page.getByRole('combobox', { name: 'Select profile' }).selectOption(randomProfileName2);
		await page.getByRole('button', { name: 'Save' }).click();
		await page.waitForURL(/\/v2\/admin\/users\/\d+\/edit/);
		await waitPageLoading(page);
	});

	const { email: userEmail4, id: userId4 } = await createTestUser(page, randomProjectDir);
	await test.step('Associate User4 to Profile2', async () => {
		await page.goto(`/v2/admin/users/${userId4}/edit`);
		await waitPageLoading(page);
		await page.getByRole('combobox', { name: 'Select resource' }).selectOption('Local resource');
		await page.getByRole('combobox', { name: 'Select profile' }).selectOption(randomProfileName1);
		await page.getByRole('button', { name: 'Save' }).click();
		await page.waitForURL(/\/v2\/admin\/users\/\d+\/edit/);
		await waitPageLoading(page);
	});

	await test.step('Open admin project page', async () => {
		await page.goto('/v2/admin');
		await waitPageLoading(page);
		await page.getByRole('link', { name: 'Search projects' }).click();
		await page.waitForURL(/\/v2\/admin\/projects$/);
		await waitPageLoading(page);

		await page.getByLabel('Name').fill(project.name.toUpperCase());
		await page.getByRole('button', { name: 'Search projects' }).click();

		await expect(page.getByRole('button', { name: 'Change ownership' })).toHaveCount(1);
	});

	await test.step('Pass ownership to User 1', async () => {
		await page.getByRole('button', { name: 'Change ownership' }).click();

		const modal = await waitModal(page);
		await expect(
			modal.getByText(`The current owner (${adminEmail}) will loose access to this project.`)
		).toBeVisible();

		const changeOwnerButton = modal.getByRole('button', { name: 'Change owner' });
		await expect(changeOwnerButton).toBeDisabled();

		await page.getByLabel('New owner').selectOption(userEmail1);
		await expect(changeOwnerButton).toBeEnabled();
		await changeOwnerButton.click();
		await expect(
			modal.getByText(`You are about to transfer ownership of Project ${project.id}`)
		).toBeVisible();
		await expect(modal.getByText(adminEmail)).toBeVisible();
		await expect(modal.getByText(userEmail1)).toBeVisible();

		// No warning about profiles
		await expect(modal.getByText('Users are associated to different profiles.')).not.toBeVisible();
		// OK
		await page.getByRole('button', { name: 'Confirm' }).click();
		await waitPageLoading(page);

		const row = page.getByRole('row', { name: new RegExp(project.name) });
		await expect(row.getByText(userEmail1)).toBeVisible();
		await expect(row.getByText(adminEmail)).not.toBeVisible();
	});

	await test.step('Pass ownership to User 2', async () => {
		await page.getByRole('button', { name: 'Change ownership' }).click();

		const modal = await waitModal(page);
		await expect(
			modal.getByText(`The current owner (${userEmail1}) will loose access to this project.`)
		).toBeVisible();

		await page.getByLabel('New owner').selectOption(userEmail2);
		await modal.getByRole('button', { name: 'Change owner' }).click();

		// Warning about profiles
		await expect(modal.getByText('Users are associated to different profiles.')).toBeVisible();
		// OK
		await page.getByRole('button', { name: 'Confirm' }).click();
		await waitPageLoading(page);

		const row = page.getByRole('row', { name: new RegExp(project.name) });
		await expect(row.getByText(userEmail2)).toBeVisible();
		await expect(row.getByText(userEmail1)).not.toBeVisible();
	});

	await test.step('Pass ownership to User 3 and User 4', async () => {
		await page.getByRole('button', { name: 'Change ownership' }).click();

		const modal = await waitModal(page);
		await expect(
			modal.getByText(`The current owner (${userEmail2}) will loose access to this project.`)
		).toBeVisible();

		await page.getByLabel('New owner').selectOption(userEmail3);
		await modal.getByRole('button', { name: 'Change owner' }).click();

		// Warning about profiles
		await expect(modal.getByText('Users are associated to different profiles.')).toBeVisible();
		// FAIL
		await page.getByRole('button', { name: 'Confirm' }).click();
		await expect(
			modal.getByText('Users are associated to different computational resources')
		).toBeVisible();

		await page.getByRole('button', { name: 'Cancel' }).click();

		await page.getByLabel('New owner').selectOption(userEmail4);
		await modal.getByRole('button', { name: 'Change owner' }).click();

		// No warning about profiles
		await expect(modal.getByText('Users are associated to different profiles.')).not.toBeVisible();
		// FAIL
		await page.getByRole('button', { name: 'Confirm' }).click();

		await expect(
			modal.getByText(
				`Cannot transfer project ownership because zarr_dir='${dataset.zarr_dir}' is not relative to one of ${userEmail4} project dirs.`
			)
		).toBeVisible();

		await closeModal(page);
	});

	await test.step('Search by email', async () => {
		await page.getByRole('button', { name: 'Reset' }).click();
		await expect(page.getByRole('row', { name: new RegExp(project.name) })).toHaveCount(0);

		await page.getByRole('combobox', { name: 'User' }).selectOption(userEmail2);
		await page.getByRole('button', { name: 'Search projects' }).click();
		await expect(page.getByRole('row', { name: new RegExp(project.name) })).toHaveCount(1);

		await page.getByRole('combobox', { name: 'User' }).selectOption(userEmail1);
		await page.getByRole('button', { name: 'Search projects' }).click();
		await expect(page.getByRole('row', { name: new RegExp(project.name) })).toHaveCount(0);
	});
});
