import { expect, test } from '@playwright/test';

test('expect example page to exist', async ({ page }) => {
	await page.goto('/task/examples');
	await expect(page).toHaveURL(/.*task*/);
});