import { expect, test } from '@playwright/test';
import { waitPageLoading } from './utils.js';

// Reset storage state for this file to avoid being authenticated
test.use({ storageState: { cookies: [], origins: [] } });

test('OAuth2 account', async ({ page }) => {
	if (process.env.SKIP_OAUTH_TEST === 'true') {
		console.warn(
			`WARNING: Skipping OAuth2 test since SKIP_OAUTH_TEST environment variable is set to true`
		);
		return;
	}

	await test.step('Login using OAuth2 provider', async () => {
		await page.goto('/');
		expect(await page.textContent('h1')).toBe('Welcome to Fractal web client.');

		await page.getByRole('link', { name: 'Login' }).first().click();

		await waitPageLoading(page);

		await page.getByText('Login with OAuth2 provider').click();
		await expect(page.getByText('as a non-verified user, you have limited access')).toBeVisible();
	});

	await test.step('Check that OAuth2 account is listed on profile', async () => {
		await page.goto('/profile');
		const row = page.getByRole('row', { name: 'OAuth2 accounts' });
		await expect(row).toContainText('kilgore@kilgore.trout');
		await expect(row).toContainText('openid');
	});

	await test.step('Logout', async () => {
		await page.getByRole('button', { name: 'kilgore@kilgore.trout' }).click();
		await page.getByRole('link', { name: 'Logout' }).click();
		await page.waitForURL('/');

		await expect(page.getByText('kilgore@kilgore.trout')).toHaveCount(0);
		await expect(page.getByText('Login')).toHaveCount(2);
	});
});
