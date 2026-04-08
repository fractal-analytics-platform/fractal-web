import { expect, test } from '@playwright/test';
import { createProject, login, setUploadFile, waitPageLoading } from '../utils.js';
import { createTestUser } from './user_utils.js';
import { createDataset } from './dataset_utils.js';
import path from 'path';
import { fileURLToPath } from 'url';

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
	await test.step('Login as superuser', async () => {
		await login(page, 'admin@fractal.xy', '1234');
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

	const userEmail1 = await createTestUser(page);

	const userEmail2 = await createTestUser(page);
	await test.step('Associate User2 to Profile2', async () => {
		await page.getByRole('combobox', { name: 'Select resource' }).selectOption('Local resource');
		await page.getByRole('combobox', { name: 'Select profile' }).selectOption(randomProfileName1);
		await page.getByRole('button', { name: 'Save' }).click();
		await page.waitForURL(/\/v2\/admin\/users\/\d+\/edit/);
		await waitPageLoading(page);
	});

	const userEmail3 = await createTestUser(page);
	await test.step('Associate User3 to Profile3', async () => {
		await page.getByRole('combobox', { name: 'Select resource' }).selectOption(randomResourceName);
		await page.getByRole('combobox', { name: 'Select profile' }).selectOption(randomProfileName2);
		await page.getByRole('button', { name: 'Save' }).click();
		await page.waitForURL(/\/v2\/admin\/users\/\d+\/edit/);
		await waitPageLoading(page);
	});

	const userEmail4 = await createTestUser(page, randomProjectDir);

	// TODO: find `project` in the admin-project page
	// TODO: pass ownership to User1 -> OK
	// TODO: pass ownership to User2 -> See profile warning -> OK
	// TODO: pass ownership to User3 -> See profile warning -> FAIL for different resources
	// TODO: pass ownership to User4 -> FAIL for project dirs

	console.log(dataset, userEmail1, userEmail2, userEmail3, userEmail4);
});
