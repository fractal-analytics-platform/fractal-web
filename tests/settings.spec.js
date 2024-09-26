import { expect, test } from '@playwright/test';
import { login, logout, waitPageLoading } from './utils.js';

// Reset storage state for this file to avoid being authenticated
test.use({ storageState: { cookies: [], origins: [] } });

test('User settings', async ({ page }) => {
	const randomUsername = Math.random().toString(36).substring(7);
	const randomEmail = `${randomUsername}@example.com`;
	const randomSlurmAccount = `${randomUsername}_slurm`;

	await test.step('Login as admin and create test user', async () => {
		await login(page, 'admin@fractal.xy', '1234');
		await page.goto('/v2/admin/users/register');
		await waitPageLoading(page);
		await page.getByRole('textbox', { name: 'E-mail' }).fill(randomEmail);
		await page.getByRole('textbox', { name: 'Password', exact: true }).fill('1234');
		await page.getByRole('textbox', { name: 'Confirm password' }).fill('1234');
		await page.getByRole('button', { name: 'Save' }).click();
		await page.waitForURL(/\/v2\/admin\/users\/\d+\/edit/);
		await logout(page, 'admin@fractal.xy');
	});

	await test.step('Login as test user ad open user settings page', async () => {
		await login(page, randomEmail, '1234');
		await page.getByRole('button', { name: randomEmail }).click();
		await page.getByRole('link', { name: 'My settings' }).click();
		await waitPageLoading(page);
	});

	await test.step('Add SLURM account (validation error)', async () => {
		const addAccountBtn = page.getByRole('button', { name: 'Add SLURM account' });
		await addAccountBtn.click();
		await addAccountBtn.click();
		await page.getByLabel('SLURM account 1').fill(randomSlurmAccount);
		await page.getByLabel('SLURM account 2').fill(randomSlurmAccount);
		await page.getByRole('button', { name: 'Save' }).click();
		await page.getByText('`slurm_accounts` list has repetitions').waitFor();
	});

	await test.step('Add SLURM account and cache dir (success)', async () => {
		await page.getByLabel('Remove SLURM account').last().click();
		await page.getByRole('textbox', { name: 'Cache dir' }).fill('/tmp');
		await page.getByRole('button', { name: 'Save' }).click();
		await expect(page.getByText('User settings successfully updated')).toBeVisible();
	});

	await test.step('Attempt to set cache dir to non absolute path', async () => {
		await page.getByRole('textbox', { name: 'Cache dir' }).fill('xxx');
		await page.getByRole('button', { name: 'Save' }).click();
		await page
			.getByText("String attribute 'cache_dir' must be an absolute path (given 'xxx').")
			.waitFor();
		await expect(page.getByText('`slurm_accounts` list has repetitions')).not.toBeVisible();
	});

	await test.step('Remove cache dir', async () => {
		await page.getByRole('textbox', { name: 'Cache dir' }).fill('');
		await page.getByRole('button', { name: 'Save' }).click();
		await expect(page.getByText('User settings successfully updated')).toBeVisible();
	});

	await test.step('Verify data was updated', async () => {
		await page.reload();
		await waitPageLoading(page);
		await expect(page.getByLabel('SLURM account 1')).toHaveValue(randomSlurmAccount);
		await expect(page.getByRole('textbox', { name: 'Cache dir' })).toHaveValue('');
	});

	await test.step('Logout test user', async () => {
		await logout(page, randomEmail);
	});
});
