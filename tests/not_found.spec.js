import { expect, test } from '@playwright/test';

test('Handles not found pages', async ({ page }) => {
	await page.goto('/foo');
	await expect(page.getByText('Route not found')).toHaveCount(1);
	await page.goto('/_app/foo');
	await expect(page.getByText('Route not found')).toHaveCount(1);
});
