import { expect, test } from '@playwright/test';
import { login, logout, waitPageLoading } from '../utils.js';

// Reset storage state for this file to avoid being authenticated
test.use({ storageState: { cookies: [], origins: [] } });

test('User without profile', async ({ page }) => {
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

		// Unset the profile
		await page
			.getByRole('combobox', { name: 'Select resource' })
			.selectOption('Select resource...');
		await expect(page.getByRole('combobox', { name: 'Select profile' })).toBeDisabled();
		await expect(page.getByRole('combobox', { name: 'Select profile' })).toHaveValue('');

		await page.getByRole('button', { name: 'Save' }).first().click();
		await page.waitForURL(/\/v2\/admin\/users\/\d+\/edit/);
	});

	await test.step('Login as test user', async () => {
		await logout(page, 'admin@fractal.xy');

		await page.goto('/auth/login');
		await waitPageLoading(page);
		await page.getByRole('button', { name: 'Log in with username & password' }).click();
		await page.getByLabel('Email address').fill(randomEmail);
		await page.getByLabel('Password').fill('1234');
		await page.getByRole('button', { name: 'Log in', exact: true }).click();

		await page.waitForURL('/');

		await expect(
			page.getByText(/This user is not authorized to use this Fractal instance/)
		).toBeVisible();

		await logout(page, randomEmail);
	});
});
