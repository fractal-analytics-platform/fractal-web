import { expect, test } from '@playwright/test';
import { waitPageLoading } from './utils.js';

test.use({
	permissions: ['clipboard-write']
});

test('Copy token test', async ({ page }) => {
	await page.goto('/profile');
	await waitPageLoading(page);
	await page.getByRole('button', { name: 'admin@fractal.xy' }).click();
	await page.getByRole('button', { name: 'Get token' }).click();
	await expect(page.getByText('Token copied to clipboard')).toBeVisible();
});
