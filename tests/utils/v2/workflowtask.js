import { expect } from '@playwright/test';

/**
 * @param {import('@playwright/test').Page} page
 * @param {number|undefined=} count
 */
export async function waitTaskSubmitted(page, count = undefined) {
	await expect(page.getByText('The last job failed with the following error')).toHaveCount(0);
	await expect(page.getByRole('button', { name: 'Stop workflow' })).toBeVisible();
	if (count !== undefined) {
		await expect(page.getByLabel('Submitted images')).toHaveCount(count);
	}
}

/**
 * @param {import('@playwright/test').Page} page
 * @param {number|undefined=} count
 */
export async function waitTasksSuccess(page, count = undefined) {
	await expect(page.getByRole('button', { name: 'Stop workflow' })).not.toBeVisible({
		timeout: 24000
	});
	const errorAlert = page.getByText('The last job failed with the following error');
	if (await errorAlert.isVisible()) {
		const error = await page.locator('.alert.border-danger').innerText();
		console.error(error);
	}
	await expect(errorAlert).toHaveCount(0);
	if (count !== undefined) {
		await expect(page.getByLabel('Done images')).toHaveCount(count);
	}
}

/**
 * @param {import('@playwright/test').Page} page
 */
export async function waitTaskFailure(page) {
	await expect(page.getByRole('button', { name: 'Stop workflow' })).not.toBeVisible({
		timeout: 8000
	});
	await expect(page.getByText('The last job failed with the following error')).toBeVisible();
}
