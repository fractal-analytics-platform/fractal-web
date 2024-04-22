import { expect, test } from './workflow_fixture.js';
import { waitModalClosed, waitPageLoading } from '../utils.js';
import path from 'path';
import os from 'os';
import fs from 'fs';
import { createDataset } from './dataset_utils.js';

test('Collect and run mock tasks [v2]', async ({ page, workflow, request }) => {
	const tasksMockWheelUrl =
		'https://github.com/fractal-analytics-platform/fractal-server/raw/main/tests/v2/fractal_tasks_mock/dist/fractal_tasks_mock-0.0.1-py3-none-any.whl';

	await page.waitForURL(workflow.url);
	await waitPageLoading(page);

	/** @type {string} */
	let datasetName1;
	/** @type {number} */
	let datasetId1;
	await test.step('Create first test dataset', async () => {
		const { name, id } = await createDataset(page, workflow.projectId);
		datasetName1 = name;
		datasetId1 = id;
	});

	/** @type {string} */
	let datasetName2;
	await test.step('Create second test dataset', async () => {
		const { name } = await createDataset(page, workflow.projectId);
		datasetName2 = name;
	});

	await test.step('Go to tasks page', async () => {
		await page.goto('/v2/tasks');
		await waitPageLoading(page);
	});

	let skipTasksCollection = false;
	if ((await page.getByRole('table').last().getByText('MIP_compound').count()) > 0) {
		console.warn('WARNING: Mock tasks V2 already collected. Skipping tasks collection');
		skipTasksCollection = true;
	}

	if (!skipTasksCollection) {
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

		let rowsCount;

		await test.step('Collect mock tasks', async () => {
			rowsCount = await page.getByRole('table').last().locator('tbody tr').count();

			await page.getByText('Local', { exact: true }).click();
			await page.getByRole('textbox', { name: 'Package', exact: true }).fill(tasksMockWheelFile);
			await page.getByRole('button', { name: 'Collect', exact: true }).click();

			// Wait for Task collections table
			await page.waitForFunction(
				(expectedCount) => document.querySelectorAll('table').length === expectedCount,
				2
			);
			await expect(
				page.locator('table tbody tr:first-child td:nth-child(2)').first()
			).toContainText('fractal_tasks_mock');
			expect(await getStatus(page)).toMatch(/^(pending|installing)$/);
		});

		await test.step('Wait tasks collection', async () => {
			await page.waitForFunction(
				() =>
					document.querySelector('table tbody tr:first-child td:nth-child(4)')?.textContent === 'OK'
			);
		});

		await test.step('Check tasks list', async () => {
			await expect(page.getByRole('table').last().locator('tbody tr')).toHaveCount(rowsCount + 13);
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
	}

	await test.step('Go to workflow page', async () => {
		await page.goto(workflow.url);
		await waitPageLoading(page);
	});

	await test.step('Select the first dataset', async () => {
		await page
			.getByRole('combobox', { name: 'Dataset', exact: true })
			.first()
			.selectOption(datasetName1);
	});

	await test.step('Add and select create_ome_zarr_compound', async () => {
		await workflow.addCollectedTask('create_ome_zarr_compound');
		await workflow.selectTask('create_ome_zarr_compound');
	});

	await test.step('Fill create_ome_zarr_compound arguments', async () => {
		await page.getByRole('textbox', { name: 'Image Dir' }).fill('/tmp/playwright/test1');
		await page.getByRole('button', { name: 'Save changes' }).click();
		await page.getByText('Arguments changes saved successfully').waitFor();
	});

	await test.step('Start the job', async () => {
		await page.getByRole('button', { name: 'Run workflow' }).click();
		const modal = page.locator('.modal.show');
		await modal.waitFor();
		await expect(
			modal
				.getByRole('combobox', { name: 'Dataset', exact: true })
				.getByRole('option', { selected: true })
		).toHaveText(datasetName1);
		await expect(
			modal
				.getByRole('combobox', { name: 'First task (Optional)' })
				.getByRole('option', { selected: true })
		).toHaveText('create_ome_zarr_compound');
		await page.getByRole('button', { name: 'Run', exact: true }).click();
		await page.getByRole('button', { name: 'Confirm' }).click();
		await waitModalClosed(page);
	});

	await test.step('Wait tasks submitted', async () => {
		const spinners = page.locator('.job-status-submitted.spinner-border');
		await spinners.waitFor();
		expect(await spinners.count()).toEqual(1);
	});

	await test.step('Wait task success', async () => {
		await page.locator('.job-status-icon.bi-check').waitFor();
	});

	await test.step('Open "Continue workflow" modal', async () => {
		await page.getByRole('button', { name: 'Continue workflow' }).click();
		const modal = page.locator('.modal.show');
		await modal.waitFor();
		// Check that confirm mode has been reset
		expect(await page.getByRole('button', { name: 'Run', exact: true }).isVisible()).toEqual(true);
	});

	await test.step('Verify that the dataset contains some images', async () => {
		await page.goto(`/v2/projects/${workflow.projectId}/datasets/${datasetId1}`);
		await waitPageLoading(page);
		await expect(page.getByRole('table').getByRole('row')).toHaveCount(4);
	});

	await test.step('Go back to workflow page', async () => {
		await page.goto(workflow.url);
		await waitPageLoading(page);
	});

	await test.step('Select the second dataset', async () => {
		await page
			.getByRole('combobox', { name: 'Dataset', exact: true })
			.first()
			.selectOption(datasetName2);
	});

	await test.step('Add and select generic_task', async () => {
		await workflow.addCollectedTask('generic_task');
		await workflow.selectTask('generic_task');
	});

	await test.step('Fill generic_task arguments, set "Raise Error" to true', async () => {
		await page.getByRole('switch').check();
		await page.getByRole('button', { name: 'Save changes' }).click();
		await page.getByText('Arguments changes saved successfully').waitFor();
	});

	await test.step('Start the new job', async () => {
		await page.getByRole('button', { name: 'Run workflow' }).click();
		const modal = page.locator('.modal.show');
		await modal.waitFor();
		await page.getByRole('button', { name: 'Run', exact: true }).click();
		await page.getByRole('button', { name: 'Confirm' }).click();
		await waitModalClosed(page);
	});

	await test.step('Wait tasks submitted', async () => {
		const spinners = page.locator('.job-status-submitted.spinner-border');
		await expect(spinners).toHaveCount(2);
	});

	await test.step('Wait job failure', async () => {
		await page.locator('.job-status-icon.bi-x').waitFor();
		await page.getByText('The last job failed with the following error').waitFor();
	});

	await test.step('Fill generic_task arguments, set "Raise Error" to false', async () => {
		await page.getByRole('switch').uncheck();
		await page.getByRole('button', { name: 'Save changes' }).click();
		await page.getByText('Arguments changes saved successfully').waitFor();
	});

	await test.step('Continue the workflow from failed task', async () => {
		await page.getByRole('button', { name: 'Continue workflow' }).click();
		const modal = page.locator('.modal.show');
		await modal.waitFor();
		await expect(
			modal
				.getByRole('combobox', { name: 'First task (Optional)' })
				.getByRole('option', { selected: true })
		).toHaveText('generic_task');
		await modal.getByRole('button', { name: 'Run', exact: true }).click();
		await modal.getByRole('button', { name: 'Confirm' }).click();
		await waitModalClosed(page);
	});

	await test.step('Wait tasks submitted', async () => {
		const spinners = page.locator('.job-status-submitted.spinner-border');
		await spinners.waitFor();
		expect(await spinners.count()).toEqual(1);
	});

	await test.step('Wait tasks success', async () => {
		await expect(page.locator('.job-status-icon.bi-check')).toHaveCount(2);
	});

	await test.step('Cleanup zarr_dir', async () => {
		fs.rmSync(`/tmp/playwright/datasets/${datasetName2}`, { recursive: true });
	});

	await test.step('Restart the workflow replacing dataset', async () => {
		await page.getByRole('button', { name: 'Restart workflow' }).click();
		const modal = page.locator('.modal.show');
		await modal.waitFor();
		await expect(
			modal
				.getByRole('combobox', { name: 'First task (Optional)' })
				.getByRole('option', { selected: true })
		).toHaveText('create_ome_zarr_compound');
		await modal.getByRole('button', { name: 'Run', exact: true }).click();
		await modal.getByRole('button', { name: 'Confirm' }).click();
		await waitModalClosed(page);
	});

	await test.step('Wait tasks submitted', async () => {
		const spinners = page.locator('.job-status-submitted.spinner-border');
		await expect(spinners).toHaveCount(2);
	});

	await test.step('Wait tasks success', async () => {
		await expect(page.locator('.job-status-icon.bi-check')).toHaveCount(2);
	});

	await test.step('Cleanup zarr_dir', async () => {
		fs.rmSync(`/tmp/playwright/datasets/${datasetName2}`, { recursive: true });
	});

	await test.step('Restart the workflow creating a new dataset', async () => {
		await page.getByRole('button', { name: 'Restart workflow' }).click();
		const modal = page.locator('.modal.show');
		await modal.waitFor();
		await modal.getByRole('checkbox', { name: 'Replace existing dataset' }).uncheck();
		await modal.getByRole('button', { name: 'Run', exact: true }).click();
		await modal.getByRole('button', { name: 'Confirm' }).click();
		await waitModalClosed(page);
	});

	await test.step('Check the new dataset name', async () => {
		await expect(
			page
				.getByRole('combobox', { name: 'Dataset', exact: true })
				.first()
				.getByRole('option', { selected: true })
		).toHaveText(`${datasetName2}_1`);
	});

	await test.step('Wait tasks submitted', async () => {
		const spinners = page.locator('.job-status-submitted.spinner-border');
		await expect(spinners).toHaveCount(2);
	});

	await test.step('Wait tasks success', async () => {
		await expect(page.locator('.job-status-icon.bi-check')).toHaveCount(2);
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
