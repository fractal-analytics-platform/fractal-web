import { expect, test } from '@playwright/test';
import { login, logout, waitModal, waitPageLoading } from './utils.js';

// Reset storage state for this file to avoid being authenticated
test.use({ storageState: { cookies: [], origins: [] } });

test('Admin without profile', async ({ page }) => {
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

	await test.step('Grant superuser privileges and unset the profile', async () => {
		await page.getByLabel('Superuser').check();

		// Unset the profile
		await page
			.getByRole('combobox', { name: 'Select resource' })
			.selectOption('Select resource...');
		await expect(page.getByRole('combobox', { name: 'Select profile' })).toBeDisabled();
		await expect(page.getByRole('combobox', { name: 'Select profile' })).toHaveValue('');

		await page.getByRole('button', { name: 'Save' }).click();

		const modal = await waitModal(page);
		await modal.getByRole('button', { name: 'Confirm' }).click();

		await expect(page.getByText('User successfully updated')).toBeVisible();
	});

	await test.step('Login as test user', async () => {
		await logout(page, 'admin@fractal.xy');

		await page.goto('/auth/login');
		await waitPageLoading(page);
		await page.getByRole('button', { name: 'Log in with username & password' }).click();
		await page.getByLabel('Email address').fill(randomEmail);
		await page.getByLabel('Password').fill('1234');
		await page.getByRole('button', { name: 'Log in', exact: true }).click();

		await page.waitForURL(/\/v2\/projects/);

		await expect(page.getByText(/Forbidden access/)).toBeVisible();
	});

	await test.step('Set user profile', async () => {
		await page.goto('/v2/admin/users');
		await waitPageLoading(page);

		await page.getByRole('row', { name: randomEmail }).getByRole('link', { name: 'Edit' }).click();

		await page.getByRole('combobox', { name: 'Select resource' }).selectOption('Local resource');
		await page.getByRole('combobox', { name: 'Select profile' }).selectOption('Local profile');
		await page.getByRole('button', { name: 'Save' }).click();
		await expect(page.getByText('User successfully updated')).toBeVisible();
	});

	await test.step('Check projects page', async () => {
		await page.goto('/v2/projects');
		await waitPageLoading(page);

		await expect(page.getByRole('button', { name: 'Create new project' })).toBeVisible();
		await logout(page, randomEmail);
	});
});
