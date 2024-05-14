import { expect } from '@playwright/test';

/**
 * @param {import('@playwright/test').Page} page
 * @param {number} count
 */
export async function waitTaskSubmitted(page, count) {
	await expect(page.getByText('The last job failed with the following error')).toHaveCount(0);
	if ((await page.locator('.job-status-icon.bi-check').count()) > 0) {
		return;
	}
	const spinners = page.locator('.job-status-submitted.spinner-border');
	await expect(spinners).toHaveCount(count);
}

/**
 * @param {import('@playwright/test').Page} page
 * @param {number} count
 */
export async function waitTasksSuccess(page, count) {
	const spinners = page.locator('.job-status-submitted.spinner-border');
	await expect(spinners).toHaveCount(0);
	const errorAlert = page.getByText('The last job failed with the following error');
	if (await errorAlert.isVisible()) {
		const error = await page.locator('.alert.border-danger').innerText();
		console.error(error);
	}
	await expect(errorAlert).toHaveCount(0);
	await page.locator('.job-status-icon.bi-check').first().waitFor();
	await expect(page.locator('.job-status-icon.bi-check')).toHaveCount(count);
}
