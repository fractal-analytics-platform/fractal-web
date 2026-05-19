import { expect, test } from '@playwright/test';
import { waitPageLoading } from '../../utils/utils.js';
import path from 'path';
import os from 'os';
import fs from 'fs';

const taskName = 'mock-pytorch-pixi-tasks';

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

	// Wait for Task activities table
	await expect(page.getByRole('table')).toHaveCount(2);

	if (
		await page.getByRole('table').last().getByRole('row', { name: taskName }).first().isVisible()
	) {
		console.warn('WARNING: Pixi tasks already collected. Skipping tasks collection');
	} else {
		test.slow();

		const tasksMockPixiUrl =
			'https://github.com/fractal-analytics-platform/testing-tasks-mock-pixi/releases/download/0.6.0/mock_pytorch_pixi_tasks-0.6.0.tar.gz';

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
			tasksMockPixiFile = path.resolve(tasksMockPixiFolder, 'mock_pytorch_pixi_tasks-0.6.0.tar.gz');
			fs.writeFileSync(tasksMockPixiFile, body);
		});

		await test.step('Collect pixi tasks', async () => {
			const fileChooserPromise = page.waitForEvent('filechooser');
			await page.getByText('Upload tar.gz file', { exact: true }).click();
			const fileChooser = await fileChooserPromise;
			await fileChooser.setFiles(tasksMockPixiFile);

			await expect(page.getByRole('switch')).toBeChecked();

			await page.getByRole('button', { name: 'Collect', exact: true }).click();
			await expect(page.getByRole('row', { name: /pending|ongoing/ })).toBeVisible();
		});

		await test.step('Wait tasks activities', async () => {
			await expect(page.getByRole('row', { name: /pending|ongoing/ })).not.toBeVisible({
				timeout: 30000
			});
		});

		await test.step('Check tasks list', async () => {
			await expect(
				page.getByRole('table').nth(1).getByRole('row', { name: taskName }).first()
			).toBeVisible();
		});

		await test.step('Cleanup temporary file', async () => {
			fs.rmSync(tasksMockPixiFile);
		});

		await test.step('Attempt to collect tasks without a file', async () => {
			await page.getByRole('button', { name: 'Collect', exact: true }).click();
			await expect(page.getByText('Field required')).toBeVisible();
		});
	}

	await test.step('Check pixi origin in /v2/admin/task-groups page', async () => {
		await page.goto('/v2/admin/task-groups');
		await waitPageLoading(page);
		await page.getByRole('combobox', { name: 'Origin' }).selectOption('Pixi');
		await page.getByRole('button', { name: 'Search task groups' }).click();
		await expect(page.getByText('The query returned 1 matching result')).toBeVisible();
		await expect(page.getByRole('cell', { name: taskName })).toBeVisible();
	});

	await test.step('Deactivate and reset', async () => {
		await page.getByRole('textbox', { name: 'Package name' }).fill(taskName);
		await page.getByRole('button', { name: 'Search task groups' }).click();
		await page.getByRole('row', { name: taskName }).getByRole('button', { name: 'Manage' }).click();
		const modal = page.locator('.modal.show');
		await modal.waitFor();
		await modal.getByRole('button', { name: 'Deactivate task group' }).click();
		await modal.getByRole('button', { name: 'Confirm' }).click();
		await page.waitForURL(/\/v2\/admin\/task-groups\/activities\?activity_id=\d+/);
		await page.goBack();
		await waitPageLoading(page);

		await page.getByRole('textbox', { name: 'Package name' }).fill(taskName);
		await page.getByRole('button', { name: 'Search task groups' }).click();
		await page.getByRole('row', { name: taskName }).getByRole('button', { name: 'Manage' }).click();
		await modal.waitFor();
		await modal.getByRole('link', { name: 'Reset task group' }).click();
		await page.waitForURL(/\/v2\/admin\/task-groups\/\d\/reset/);
		const lockfileSwitch = page.getByRole('switch', {
			name: 'Use pixi.lock file'
		});
		await lockfileSwitch.check();
		await expect(lockfileSwitch).toBeChecked();

		await page.getByRole('button', { name: 'Proceed' }).click();
		await modal.waitFor();
		await expect(modal.getByText('non-reversible')).toBeVisible();
		await modal.getByRole('button', { name: 'Confirm' }).click();
		await page.waitForURL(/\/v2\/admin\/task-groups\/activities\?activity_id=\d+/);
		await waitPageLoading(page);
		await expect(page.getByRole('row')).toHaveCount(2);
		await expect(page.getByRole('row', { name: taskName })).toContainText('reset');
	});
});
