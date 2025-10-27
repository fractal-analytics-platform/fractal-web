import { expect, test } from '@playwright/test';
import { login, waitPageLoading } from '../utils.js';

// Reset storage state for this file to avoid being authenticated
test.use({ storageState: { cookies: [], origins: [] } });

test('Impersonate user', async ({ page }) => {
	const randomValue = Math.random().toString(36).substring(7);
	const randomEmail = `${randomValue}@example.com`;

	await test.step('Login as admin and create test user', async () => {
		await login(page, 'admin@fractal.xy', '1234');
		await page.goto('/v2/admin/users/register');
		await waitPageLoading(page);
		await page.getByRole('textbox', { name: 'E-mail' }).fill(randomEmail);
		await page.getByRole('textbox', { name: 'Password', exact: true }).fill('1234');
		await page.getByRole('textbox', { name: 'Confirm password' }).fill('1234');
		await page.getByRole('textbox', { name: 'Project dir' }).fill('/tmp');
		await page.getByRole('button', { name: 'Save' }).first().click();
		await page.waitForURL(/\/v2\/admin\/users\/\d+\/edit/);
	});

	await test.step('Impersonate test user', async () => {
		await page.goto('/v2/admin/impersonate');
		await waitPageLoading(page);
		await page.getByRole('combobox', { name: 'User' }).selectOption(randomEmail);
		await page.getByRole('button', { name: 'Impersonate' }).click();
		await waitPageLoading(page);
		await expect(page.getByRole('button', { name: randomEmail })).toBeVisible();
	});

	await test.step('Check profile page', async () => {
		await page.goto('/profile');
		await waitPageLoading(page);
		await expect(page.getByRole('cell', { name: randomEmail })).toBeVisible();
	});
});
