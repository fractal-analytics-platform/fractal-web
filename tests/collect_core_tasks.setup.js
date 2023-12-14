import { expect, test } from './base_test.js';

test('Collect core tasks', async ({ page }) => {
	await page.goto('/tasks');

	if ((await page.getByRole('table').last().locator('tbody tr').count()) > 0) {
		console.warn('WARNING: Tasks already collected. Skipping tasks collections');
		return;
	}

	// Triple the default timeout
	test.slow();

	await page.locator('[name="package"]').fill('fractal-tasks-core');

	const collectBtn = page.getByRole('button', { name: /^Collect$/ });
	await collectBtn.click();

	// Wait for Task collections table
	await page.waitForFunction(
		(expectedCount) => document.querySelectorAll('table').length === expectedCount,
		2
	);

	await expect(page.locator('table tbody tr:first-child td:nth-child(2)').first()).toContainText(
		'fractal-tasks-core'
	);

	expect(await getStatus(page)).toEqual('pending');

	// Wait tasks collection
	await page.waitForFunction(
		() => document.querySelector('table tbody tr:first-child td:nth-child(4)')?.textContent === 'OK'
	);

	// Delete task collection log
	const deleteCollectionLogBtn = page.locator(
		'table tr:first-child td:nth-child(5) button.btn-warning'
	);
	await deleteCollectionLogBtn.click();

	// Confirm action modal
	const modalTitle = page.locator('.modal.show .modal-title');
	await modalTitle.waitFor();
	await expect(modalTitle).toHaveText('Confirm action');
	await expect(page.locator('.modal.show .modal-body')).toContainText(
		'Remove a task collection log'
	);

	// Confirm the deletion
	await page.getByRole('button', { name: 'Confirm' }).click();

	// Reload task list
	const reloadTasksBtn = page.getByRole('table').last().getByRole('button').nth(0);
	await reloadTasksBtn.click();

	const rows = await page.getByRole('table').last().locator('tbody tr').count();
	expect(rows).toEqual(12);
});

/**
 * @param {import('@playwright/test').Page} page
 * @return {Promise<string>}
 */
async function getStatus(page) {
	const statusCell = page.locator('table tbody tr:first-child td:nth-child(4)').first();
	return await statusCell.innerText();
}
