import { expect, test } from '@playwright/test';
import { login, logout, waitPageLoading } from '../utils.js';

// Reset storage state for this file to avoid being authenticated
test.use({ storageState: { cookies: [], origins: [] } });

test('Viewer paths', async ({ page }) => {
	const randomValue = Math.random().toString(36).substring(7);
	const randomEmail = `${randomValue}@example.com`;

	await test.step('Login as admin and create test user', async () => {
		await login(page, 'admin@fractal.xy', '1234');
		await page.goto('/v2/admin/users/register');
		await waitPageLoading(page);
		await page.getByRole('textbox', { name: 'E-mail' }).fill(randomEmail);
		await page.getByRole('textbox', { name: 'Password', exact: true }).fill('1234');
		await page.getByRole('textbox', { name: 'Confirm password' }).fill('1234');
		await page.getByRole('button', { name: 'Save' }).click();
		await page.waitForURL(/\/v2\/admin\/users\/\d+\/edit/);
	});

	let groupId;
	await test.step('Create test group', async () => {
		await page.goto('/v2/admin/groups');
		await waitPageLoading(page);
		await page.getByRole('button', { name: 'Create new group' }).click();
		const modal = page.locator('.modal.show');
		await modal.waitFor();
		await modal.getByRole('textbox', { name: 'Group name' }).fill(randomValue);
		await modal.getByRole('button', { name: 'Create' }).click();
		await page.waitForURL(/\/v2\/admin\/groups\/\d+\/edit/);
		await page.getByText('Members of the group').waitFor();
		const url = page.url();
		const match = url.match(/\/v2\/admin\/groups\/(\d+)\/edit/);
		expect(match).toBeTruthy();
		if (match) {
			groupId = match[1];
		}
	});

	await test.step('Add test user to the group', async () => {
		const dragArea = page.getByText('drag the users here');
		const userBadge = page.getByRole('button', { name: randomEmail, exact: true });
		await userBadge.dragTo(dragArea);
		await expect(page.locator('.spinner-border-sm')).not.toBeVisible();
	});

	await test.step('Add viewer paths', async () => {
		const addViewerPathBtn = page.getByRole('button', { name: 'Add viewer path' });
		await addViewerPathBtn.click();
		await addViewerPathBtn.click();
		const saveBtn = page.getByRole('button', { name: 'Save' });
		await saveBtn.click();
		await expect(
			page.getByText("String attribute 'viewer_paths[0]' cannot be empty")
		).toBeVisible();
		await page.getByLabel('Viewer path #1', { exact: true }).fill('/path/to/1');
		await page.getByLabel('Viewer path #2', { exact: true }).fill('/path/to/2');
		await saveBtn.click();
		await expect(page.getByText('Paths successfully updated')).toBeVisible();
	});

	await test.step('Remove viewer paths', async () => {
		await expect(page.getByRole('textbox')).toHaveCount(3);
		await page.getByLabel('Remove viewer path #2').click();
		await page.getByRole('button', { name: 'Save' }).click();
		await expect(page.getByText('Paths successfully updated')).toBeVisible();
		await expect(page.getByRole('textbox')).toHaveCount(2);
	});

	await test.step('Check viewer paths in info page', async () => {
		await page.goto(`/v2/admin/groups/${groupId}`);
		await waitPageLoading(page);
		await expect(page.getByText('/path/to/1')).toBeVisible();
	});

	await test.step('Login as test user ad open user "Viewer paths" page', async () => {
		await logout(page, 'admin@fractal.xy');
		await login(page, randomEmail, '1234');
		await page.getByRole('button', { name: randomEmail }).click();
		await page.getByRole('link', { name: 'Viewer paths' }).click();
		await waitPageLoading(page);
		await expect(page.getByText('/path/to/1')).toBeVisible();
		await logout(page, randomEmail);
	});
});
