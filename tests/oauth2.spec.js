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

		await page.getByText('Log in with institutional account').click();
		await expect(
			page.getByText(
				'Thank you for registering for the Fractal service. Administrators have been informed to configure your account and will get back to you.'
			)
		).toBeVisible();
	});
});
