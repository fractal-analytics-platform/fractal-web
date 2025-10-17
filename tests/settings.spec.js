import { expect, test } from '@playwright/test';
import { login, logout, waitPageLoading } from './utils.js';

// Reset storage state for this file to avoid being authenticated
test.use({ storageState: { cookies: [], origins: [] } });

test('User settings', async ({ page }) => {
	const randomUsername = Math.random().toString(36).substring(7);
	const randomEmail = `${randomUsername}@example.com`;

	await test.step('Login as admin and create test user', async () => {
		await login(page, 'admin@fractal.xy', '1234');
		await page.goto('/v2/admin/users/register');
		await waitPageLoading(page);
		await page.getByRole('textbox', { name: 'E-mail' }).fill(randomEmail);
		await page.getByRole('textbox', { name: 'Password', exact: true }).fill('1234');
		await page.getByRole('textbox', { name: 'Confirm password' }).fill('1234');
		await page.getByRole('button', { name: 'Save' }).click();
		await page.waitForURL(/\/v2\/admin\/users\/\d+\/edit/);
		await page.getByRole('textbox', { name: 'Project dir' }).fill('/tmp/project');
		await page.getByRole('button', { name: 'Save' }).click();
		await expect(page.getByText('User successfully updated')).toBeVisible();
		await logout(page, 'admin@fractal.xy');
	});

	await test.step('Login as test user ad open user settings page', async () => {
		await login(page, randomEmail, '1234');
		await page.getByRole('button', { name: randomEmail }).click();
		await page.getByRole('link', { name: 'My settings' }).click();
		await waitPageLoading(page);
		await expect(page.getByText('/tmp/project')).toBeVisible();
	});

	await test.step('Logout test user', async () => {
		await logout(page, randomEmail);
	});
});
