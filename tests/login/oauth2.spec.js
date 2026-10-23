import { expect } from '@playwright/test';
import { waitPageLoading } from '../utils/utils.js';
import { test } from '../base_fixture';

// Reset storage state for this file to avoid being authenticated
test.use({ storageState: { cookies: [], origins: [] } });

test.beforeEach(async ({ context }) => {
	// Proxying oauth2 test service in container
	const oauthEndpoint = process.env.OAUTH_OIDC_CONFIG_ENDPOINT;
	if (oauthEndpoint && oauthEndpoint.includes('oauth2:5556')) {
		await context.route(/http:\/\/127.0.0.1:5556/, async (route) => {
			const url = route.request().url();
			await route.continue({ url: url.replace('127.0.0.1', 'oauth2') });
		});
	}
});

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
