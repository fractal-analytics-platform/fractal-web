import { expect } from '@playwright/test';
import { test } from './base_fixture';
import { waitPageLoading } from './utils/utils.js';

test('Copy token test', async ({ page }) => {
	await page.goto('/profile');
	await waitPageLoading(page);
	await page.getByRole('button', { name: 'admin@fractal.xy' }).click();
	await page.getByRole('button', { name: 'Get token' }).click();
	await expect(page.getByText('Token copied to clipboard')).toBeVisible();
});
