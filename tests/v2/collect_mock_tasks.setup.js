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
		await page.goto('/v2/tasks/management');
		await waitPageLoading(page);
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
		const tasksMockWheelFolder = path.resolve(os.tmpdir(), 'playwright');
		if (!fs.existsSync(tasksMockWheelFolder)) {
			fs.mkdirSync(tasksMockWheelFolder);
		}
		tasksMockWheelFile = path.resolve(
			tasksMockWheelFolder,
			'fractal_tasks_mock-0.0.1-py3-none-any.whl'
		);
		fs.writeFileSync(tasksMockWheelFile, body);
	});

	await test.step('Collect mock tasks', async () => {
		await page.getByText('Local whl', { exact: true }).click();

		const fileChooserPromise = page.waitForEvent('filechooser');
		await page.getByText('Upload a wheel file', { exact: true }).click();
		const fileChooser = await fileChooserPromise;
		await fileChooser.setFiles(tasksMockWheelFile);

		await page.getByRole('button', { name: 'Collect', exact: true }).click();

		// Wait for Task collections table
		await page.waitForFunction(
			(expectedCount) => document.querySelectorAll('table').length === expectedCount,
			2
		);
		await expect(page.getByRole('row', { name: /pending|ongoing/ })).toBeVisible();
	});

	await test.step('Wait tasks collection', async () => {
		await expect(page.getByRole('row', { name: /pending|ongoing/ })).not.toBeVisible({
			timeout: 30000
		});
	});

	await test.step('Check tasks list', async () => {
		await expect(page.getByRole('row', { name: 'fractal-tasks-mock' }).first()).toBeVisible();
	});

	await test.step('Cleanup temporary wheel file', async () => {
		fs.rmSync(tasksMockWheelFile);
	});

	await test.step('Attempt to collect tasks without a wheel file', async () => {
		await page.getByRole('button', { name: 'Collect', exact: true }).click();
		await expect(page.getByText('Required field')).toBeVisible();
	});
});
