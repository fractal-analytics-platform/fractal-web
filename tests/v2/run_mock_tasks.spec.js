import { expect, test } from './workflow_fixture.js';
import { waitModalClosed, waitPageLoading } from '../utils.js';
import fs from 'fs';
import { createDataset } from './dataset_utils.js';
import { waitTaskFailure, waitTaskSubmitted, waitTasksSuccess } from './workflow_task_utils.js';

test('Run mock tasks [v2]', async ({ page, workflow }) => {
	await page.waitForURL(workflow.url);
	await waitPageLoading(page);

	test.slow();

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

	await test.step('Go to workflow page', async () => {
		await page.goto(workflow.url);
		await waitPageLoading(page);
	});

	await test.step('Verify that the last dataset has been automatically selected', async () => {
		await expect(
			page
				.getByRole('combobox', { name: 'Dataset', exact: true })
				.first()
				.getByRole('option', { selected: true })
		).toHaveText(datasetName2);
	});

	await test.step('Add and select create_ome_zarr_compound', async () => {
		await workflow.addTask('create_ome_zarr_compound');
		await workflow.selectTask('create_ome_zarr_compound');
	});

	await test.step('Fill create_ome_zarr_compound arguments', async () => {
		await page.getByRole('textbox', { name: 'Image Dir' }).fill('/tmp/playwright/test1');
		await page.getByRole('button', { name: 'Save changes' }).click();
		await page.getByText('Arguments changes saved successfully').waitFor();
	});

	await test.step('Select the first dataset', async () => {
		await page
			.getByRole('combobox', { name: 'Dataset', exact: true })
			.first()
			.selectOption(datasetName1);
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
				.getByRole('combobox', { name: 'Start workflow at' })
				.getByRole('option', { selected: true })
		).toHaveText('create_ome_zarr_compound');
		await page.getByRole('button', { name: 'Run', exact: true }).click();
		await page.getByRole('button', { name: 'Confirm' }).click();
		await waitModalClosed(page);
	});

	await test.step('Wait tasks submitted', async () => {
		await waitTaskSubmitted(page);
	});

	await test.step('Wait task success', async () => {
		await waitTasksSuccess(page);
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

	await test.step('Verify that the dataset used in the last job has been automatically selected', async () => {
		await expect(
			page
				.getByRole('combobox', { name: 'Dataset', exact: true })
				.first()
				.getByRole('option', { selected: true })
		).toHaveText(datasetName1);
	});

	await test.step('Select the second dataset', async () => {
		const datasetDropdown = page.getByRole('combobox', { name: 'Dataset', exact: true }).first();
		await expect(
			datasetDropdown.getByRole('option', { name: datasetName2, includeHidden: true })
		).toBeHidden();
		await datasetDropdown.selectOption(datasetName2);
	});

	await test.step('Add and select generic_task', async () => {
		await workflow.addTask('generic_task');
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
		await waitTaskSubmitted(page);
	});

	await test.step('Wait job failure', async () => {
		await waitTaskFailure(page);
	});

	await test.step('Open error modal', async () => {
		await page.getByRole('button', { name: 'Show complete log' }).click();
		const modal = page.locator('.modal.show');
		await modal.waitFor();
		await modal.getByText('This is the error message').waitFor();
		await modal.getByLabel('Close').click();
		await waitModalClosed(page);
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
				.getByRole('combobox', { name: 'Start workflow at' })
				.getByRole('option', { selected: true })
		).toHaveText('generic_task');
		await modal.getByRole('button', { name: 'Run', exact: true }).click();
		await modal.getByRole('button', { name: 'Confirm' }).click();
		await waitModalClosed(page);
	});

	await test.step('Wait tasks submitted', async () => {
		await waitTaskSubmitted(page);
	});

	await test.step('Wait tasks success', async () => {
		await waitTasksSuccess(page);
	});

	await test.step('Cleanup zarr_dir', async () => {
		fs.rmSync(`/tmp/playwright/datasets/${datasetName2}`, { recursive: true });
	});

	await test.step('Reset the workflow replacing dataset', async () => {
		await page.getByRole('button', { name: 'Reset workflow' }).click();
		const modal = page.locator('.modal.show');
		await modal.waitFor();
		await expect(
			modal
				.getByRole('combobox', { name: 'Start workflow at' })
				.getByRole('option', { selected: true })
		).toHaveText('create_ome_zarr_compound');
		await modal.getByRole('button', { name: 'Run', exact: true }).click();
		await modal.getByRole('button', { name: 'Confirm' }).click();
		await waitModalClosed(page);
	});

	await test.step('Wait tasks submitted', async () => {
		await waitTaskSubmitted(page);
	});

	await test.step('Wait tasks success', async () => {
		await waitTasksSuccess(page);
	});

	await test.step('Cleanup zarr_dir', async () => {
		await expect
			.poll(() => fs.existsSync(`/tmp/playwright/datasets/${datasetName2}`), {
				timeout: 5000,
				message: `File /tmp/playwright/datasets/${datasetName2} doesn't exist`
			})
			.toBeTruthy();
		fs.rmSync(`/tmp/playwright/datasets/${datasetName2}`, { recursive: true });
	});

	await test.step('Reset the workflow creating a new dataset', async () => {
		await page.getByRole('button', { name: 'Reset workflow' }).click();
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
		await waitTaskSubmitted(page);
	});

	await test.step('Wait tasks success', async () => {
		await waitTasksSuccess(page);
	});

	await test.step('Open the workflow jobs page', async () => {
		await page.getByRole('link', { name: 'List jobs' }).click();
		await page.waitForURL(
			`/v2/projects/${workflow.projectId}/workflows/${workflow.workflowId}/jobs`
		);
		await page.locator('table tbody').waitFor();
		expect(await page.locator('table tbody tr').count()).toEqual(5);
	});

	await test.step('Ensure jobs are ended', async () => {
		const running = await page.getByRole('row', { name: 'submitted' }).count();
		if (running > 0) {
			console.warn(
				`WARNING: waiting for the completion of a job that should have already been completed!`
			);
			await expect(page.getByRole('row', { name: 'submitted' })).toHaveCount(0, { timeout: 10000 });
		}
	});

	/** @type {string|null} */
	let jobId = null;
	await test.step('Open Info modal', async () => {
		await page.locator('table tbody tr').getByRole('button', { name: 'Info' }).first().click();
		const modalTitle = page.locator('.modal.show .modal-title');
		await modalTitle.waitFor();
		await expect(modalTitle).toContainText(`Workflow Job #`);

		const items = await page.locator('.modal.show').getByRole('listitem').allInnerTexts();
		expect(items[0]).toEqual('Id');
		jobId = items[1];
		expect(items[2]).toEqual('Workflow');
		expect(items[3]).toEqual(workflow.workflowName);
		expect(items[4]).toEqual('Project');
		expect(items[5]).toEqual(workflow.projectName);
		expect(items[6]).toEqual('Dataset');
		expect(items[7]).toEqual(`${datasetName2}_1`);
		expect(items[8]).toEqual('Status');
		expect(items[9]).toEqual('done');
	});

	let jobRow = null;
	await test.step('Check generic jobs page', async () => {
		await page.goto('/v2/jobs');
		await waitPageLoading(page);
		const rows = await page.locator('table tbody tr').all();
		for (const row of rows) {
			const id = await getJobId(page, row);
			if (id === jobId) {
				jobRow = row;
				const cells = await row.locator('td').allInnerTexts();
				expect(cells[4]).toEqual(workflow.projectName);
				expect(cells[5]).toEqual(workflow.workflowName);
				expect(cells[6]).toEqual(`${datasetName2}_1`);
				break;
			}
		}
		expect(jobRow).not.toBeNull();
	});

	await test.step('Open Logs modal', async () => {
		/** @type {import('@playwright/test').Locator} */
		const logsButton = jobRow?.getByRole('button', { name: 'Logs' });
		await logsButton.waitFor();
		await logsButton.click();
		const modalTitle = page.locator('.modal.show .modal-title');
		await modalTitle.waitFor();
		await expect(modalTitle).toHaveText('Workflow Job logs');
	});
});

/**
 * @param {import('@playwright/test').Page} page
 * @param {import('@playwright/test').Locator} row
 * @returns {Promise<string>}
 */
async function getJobId(page, row) {
	await row.getByRole('button', { name: 'Info' }).click();
	const modalTitle = page.locator('.modal.show .modal-title');
	await modalTitle.waitFor();
	const text = await modalTitle.innerText();
	const match = text.match('Workflow Job #(\\d+)');
	expect(match).not.toBeNull();
	await page.locator('.modal.show .modal-header [aria-label="Close"]').click();
	return /** @type {RegExpMatchArray} */ (match)[1];
}
