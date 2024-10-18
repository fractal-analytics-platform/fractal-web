import { expect, test } from '@playwright/test';
import { waitPageLoading } from '../utils.js';
import path from 'path';
import os from 'os';
import fs from 'fs';

test('Collect mock tasks [v2]', async ({ page, request }) => {
	const tasksMockWheelUrl =
		'https://github.com/fractal-analytics-platform/fractal-server/raw/main/tests/v2/fractal_tasks_mock/dist/fractal_tasks_mock-0.0.1-py3-none-any.whl';

	test.slow();

	await test.step('Go to tasks page', async () => {
		await page.goto('/v2/tasks');
		await waitPageLoading(page);
	});

	await test.step('Attempt to collect tasks with invalid path', async () => {
		await page.getByText('Local', { exact: true }).click();
		await page.getByRole('textbox', { name: 'Package', exact: true }).fill('./foo');
		await page.getByRole('button', { name: 'Collect', exact: true }).click();
		await expect(
			page.getByText('Local-package path must be a wheel file (given ./foo).')
		).toBeVisible();
	});

	if ((await page.getByRole('table').last().getByText('MIP_compound').count()) > 0) {
		console.warn('WARNING: Mock tasks V2 already collected. Skipping tasks collection');
		return;
	}

	/** @type {string} */
	let tasksMockWheelFile;

	await test.step('Download fractal_tasks_mock wheel', async () => {
		const response = await request.get(tasksMockWheelUrl);
		expect(response.status()).toEqual(200);
		const body = await response.body();
		const tmpDir = path.resolve(os.tmpdir(), 'playwright');
		if (!fs.existsSync(tmpDir)) {
			fs.mkdirSync(tmpDir);
		}
		tasksMockWheelFile = path.resolve(tmpDir, 'fractal_tasks_mock-0.0.1-py3-none-any.whl');
		fs.writeFileSync(tasksMockWheelFile, body);
	});

	await test.step('Collect mock tasks', async () => {
		await page.getByRole('textbox', { name: 'Package', exact: true }).fill(tasksMockWheelFile);
		await page.getByRole('button', { name: 'Collect', exact: true }).click();

		// Wait for Task collections table
		await page.waitForFunction(
			(expectedCount) => document.querySelectorAll('table').length === expectedCount,
			2
		);
		await expect(page.locator('table tbody tr:first-child td:nth-child(2)').first()).toContainText(
			'fractal-tasks-mock'
		);
		expect(await getStatus(page)).toMatch(/^(pending|installing)$/);
	});

	await test.step('Wait tasks collection', async () => {
		await page.waitForFunction(
			() =>
				document.querySelector('table tbody tr:first-child td:nth-child(4)')?.textContent === 'OK'
		);
	});

	await test.step('Check tasks list', async () => {
		await expect(page.getByRole('row', { name: 'fractal-tasks-mock' }).first()).toBeVisible();
	});

	await test.step('Delete task collection log', async () => {
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
	});

	await test.step('Cleanup temporary wheel file', async () => {
		fs.rmSync(tasksMockWheelFile);
	});
});

/**
 * @param {import('@playwright/test').Page} page
 * @return {Promise<string>}
 */
async function getStatus(page) {
	const statusCell = page.locator('table tbody tr:first-child td:nth-child(4)').first();
	return await statusCell.innerText();
}
