import { expect, test } from '@playwright/test';
import { waitPageLoading } from '../utils.js';

test('Show the admin settings page', async ({ page }) => {
	await test.step('Open the admin settings page', async () => {
		await page.goto('/v2/admin/settings');
		await waitPageLoading(page);
		await expect(page.getByRole('cell', { name: 'FRACTAL_TASKS_DIR', exact: true })).toBeVisible();
		await expect(page.getByText('**********')).not.toBeVisible();
	});

	await test.step('Display obfuscated settings', async () => {
		await page.getByRole('switch').check();
		await expect(page.getByText('**********').first()).toBeVisible();
	});
});
