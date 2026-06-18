import { expect } from '@playwright/test';
import { test } from './base_fixture';
import { waitPageLoading } from './utils/utils.js';

test('Copy token test', async ({ page }) => {
	await page.goto('/profile');
	await waitPageLoading(page);
	await page.getByRole('button', { name: 'admin@fractal.xy' }).click();
	await page.getByRole('button', { name: 'Get token' }).click();
	const toast = page.getByRole('alert');
	await expect(toast).toBeVisible();
	await expect(toast.getByText('Token copied to clipboard')).toBeVisible();
	// wait the end of the transition to avoid accessibility test false positive
	await expect(toast).not.toHaveClass(/showing/);
});
