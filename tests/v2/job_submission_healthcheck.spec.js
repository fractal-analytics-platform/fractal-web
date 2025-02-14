import { expect, test } from '@playwright/test';
import { waitPageLoading } from '../utils.js';

test('Execute the job healthcheck', async ({ page }) => {
	await test.step('Open the job healthcheck page', async () => {
		await page.goto('/healthcheck');
		await waitPageLoading(page);
	});

	await test.step('Start test', async () => {
		await page.getByRole('button', { name: 'Test' }).click();
	});

	await test.step('Verify that is correctly redirected to the workflow page', async () => {
		await page.waitForURL(/\/v2\/projects\/\d+\/workflows\/\d+/);
		await expect(page.getByText('__TEST_ECHO_TASK__').first()).toBeVisible();
	});
});
