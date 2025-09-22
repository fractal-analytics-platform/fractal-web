import { expect, test } from '@playwright/test';
import { waitPageLoading } from '../utils.js';
import path from 'path';
import os from 'os';
import fs from 'fs';

test('Pixi task collection', async ({ page, request }) => {
	if (process.env.SKIP_PIXI_TEST === 'true') {
		console.warn(
			`WARNING: Skipping Pixi test since SKIP_PIXI_TEST environment variable is set to true`
		);
		return;
	}

	await test.step('Go to tasks management page and select Pixi tasks', async () => {
		await page.goto('/v2/tasks/management');
		await waitPageLoading(page);
		await page.getByText('Pixi', { exact: true }).click();
	});

	if (
		await page
			.getByRole('table')
			.last()
			.getByRole('row', { name: 'mock-pixi-tasks' })
			.first()
			.isVisible()
	) {
		console.warn('WARNING: Pixi tasks already collected. Skipping tasks collection');
		return;
	}

	test.slow();

	const tasksMockPixiUrl =
		'https://github.com/fractal-analytics-platform/testing-tasks-mock-pixi/releases/download/0.2.1/mock_pixi_tasks-0.2.1.tar.gz';

	/** @type {string} */
	let tasksMockPixiFile;

	await test.step('Download fractal_tasks_mock wheel', async () => {
		const response = await request.get(tasksMockPixiUrl);
		expect(response.status()).toEqual(200);
		const body = await response.body();
		const tasksMockPixiFolder = path.resolve(os.tmpdir(), 'playwright');
		if (!fs.existsSync(tasksMockPixiFolder)) {
			fs.mkdirSync(tasksMockPixiFolder);
		}
		tasksMockPixiFile = path.resolve(tasksMockPixiFolder, 'mock_pixi_tasks-0.2.1.tar.gz');
		fs.writeFileSync(tasksMockPixiFile, body);
	});

	await test.step('Collect pixi tasks', async () => {
		const fileChooserPromise = page.waitForEvent('filechooser');
		await page.getByText('Upload tar.gz file', { exact: true }).click();
		const fileChooser = await fileChooserPromise;
		await fileChooser.setFiles(tasksMockPixiFile);

		await page.getByRole('button', { name: 'Collect', exact: true }).click();

		// Wait for Task activities table
		await page.waitForFunction(
			(expectedCount) => document.querySelectorAll('table').length === expectedCount,
			2
		);
		await expect(page.getByRole('row', { name: /pending|ongoing/ })).toBeVisible();
	});

	await test.step('Wait tasks activities', async () => {
		await expect(page.getByRole('row', { name: /pending|ongoing/ })).not.toBeVisible({
			timeout: 30000
		});
	});

	await test.step('Check tasks list', async () => {
		await expect(
			page.getByRole('table').nth(1).getByRole('row', { name: 'mock-pixi-tasks' }).first()
		).toBeVisible();
	});

	await test.step('Cleanup temporary file', async () => {
		fs.rmSync(tasksMockPixiFile);
	});

	await test.step('Attempt to collect tasks without a file', async () => {
		await page.getByRole('button', { name: 'Collect', exact: true }).click();
		await expect(page.getByText('Field required')).toBeVisible();
	});

	await test.step('Check pixi origin in /v2/admin/task-groups page', async () => {
		await page.goto('/v2/admin/task-groups');
		await waitPageLoading(page);
		await page.getByRole('combobox', { name: 'Origin' }).selectOption('Pixi');
		await page.getByRole('button', { name: 'Search task groups' }).click();
		await expect(page.getByText('The query returned 1 matching result')).toBeVisible();
		await expect(page.getByRole('cell', { name: 'mock-pixi-tasks' })).toBeVisible();
	});
});
