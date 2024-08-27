import { expect, test } from '@playwright/test';
import { waitPageLoading } from '../utils.js';

test('Execute the admin job healthcheck', async ({ page }) => {
	await test.step('Open the admin job healthcheck page', async () => {
		await page.goto('/v2/admin/jobs/healthcheck');
		await waitPageLoading(page);
	});

	await test.step('Attempt to run without setting the Zarr directory', async () => {
		await page.getByRole('button', { name: 'Test' }).click();
		await expect(page.getByText('Zarr directory is required')).toBeVisible();
	});

	await test.step('Set zarr directory and start test', async () => {
		await page.getByRole('textbox', { name: 'Zarr directory' }).fill('/tmp');
		await page.getByRole('button', { name: 'Test' }).click();
	});

	await test.step('Verify that is correctly redirected to the workflow page', async () => {
		await page.waitForURL(/\/v2\/projects\/\d+\/workflows\/\d+/);
		await expect(page.getByText('job_submission_health_check').first()).toBeVisible();
	});
});
