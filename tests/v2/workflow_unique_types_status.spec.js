import { expect, test } from './workflow_fixture.js';
import { selectSlimSelect, waitModalClosed, waitPageLoading } from '../utils.js';
import { createDataset } from './dataset_utils.js';
import { waitTasksSuccess } from './workflow_task_utils.js';

test('Workflow unique types are verified when using status filter', async ({ page, workflow }) => {
	await page.waitForURL(workflow.url);
	await waitPageLoading(page);

	test.slow();
	const modal = page.locator('.modal.show');

	/** @type {string} */
	let zarrDir;
	await test.step('Create test dataset', async () => {
		const dataset = await createDataset(page, workflow.projectId);
		zarrDir = dataset.zarrDir;
	});

	await test.step('Open workflow page and add first task', async () => {
		await page.goto(workflow.url);
		await waitPageLoading(page);
		await workflow.addTask('create_ome_zarr_compound');
		await workflow.selectTask('create_ome_zarr_compound');
		await page.getByRole('textbox', { name: 'Image Dir' }).fill(zarrDir);
		await page.getByRole('spinbutton', { name: 'Num Images' }).fill('2');
		await page.getByRole('button', { name: 'Save changes' }).click();
		await expect(page.getByText('Arguments changes saved successfully')).toBeVisible();
	});

	await test.step('Run workflow', async () => {
		await page.getByRole('button', { name: 'Run workflow' }).click();
		await modal.waitFor();
		await modal.getByRole('button', { name: 'Run' }).click();
		await modal.getByRole('button', { name: 'Confirm' }).click();
		await waitModalClosed(page);
		await waitTasksSuccess(page);
	});

	await test.step('Add second task and run it only on one well', async () => {
		await workflow.addTask('cellpose_segmentation');
		await workflow.selectTask('cellpose_segmentation');
		await page.getByRole('button', { name: 'Continue workflow' }).click();
		await modal.waitFor();
		await modal
			.getByRole('combobox', { name: 'Start workflow at' })
			.selectOption('cellpose_segmentation');
		await selectSlimSelect(page, modal.getByRole('combobox', { name: 'Selector for attribute well' }), 'A01');
		await modal.getByRole('button', { name: 'Apply' }).click();
		await expect(modal.getByText('Total results: 1')).toBeVisible();
		await modal.getByRole('button', { name: 'Run' }).click();
		await expect(modal.getByText('This job will process 1 image.')).toBeVisible();
		await modal.getByRole('button', { name: 'Confirm' }).click();
		await waitModalClosed(page);
		await waitTasksSuccess(page);
	});

	await test.step('Add third task and run it only on one well', async () => {
		await workflow.addTask('MIP_compound');
		await workflow.selectTask('MIP_compound');
		await page.getByRole('button', { name: 'Continue workflow' }).click();
		await modal.waitFor();
		await expect(
			modal
				.getByRole('combobox', { name: 'Start workflow at' })
				.getByRole('option', { selected: true })
		).toHaveText('MIP_compound');
		await expect(modal.getByText('Total results: 2')).toBeVisible();
		await selectSlimSelect(page, modal.getByRole('combobox', { name: 'Selector for attribute well' }), 'A01');
		await modal.getByRole('button', { name: 'Apply' }).click();
		await expect(modal.getByText('Total results: 1')).toBeVisible();
		await modal.getByRole('button', { name: 'Run' }).click();
		await expect(modal.getByText('This job will process 1 image.')).toBeVisible();
		await modal.getByRole('button', { name: 'Confirm' }).click();
		await waitModalClosed(page);
		await waitTasksSuccess(page);
	});

	await test.step('Try to continue running from the second task and verify warning', async () => {
		await workflow.selectTask('cellpose_segmentation');
		await page.getByRole('button', { name: 'Continue workflow' }).click();
		await modal.waitFor();
		await expect(
			modal
				.getByRole('combobox', { name: 'Start workflow at' })
				.getByRole('option', { selected: true })
		).toHaveText('cellpose_segmentation');
		await selectSlimSelect(page, modal.getByRole('combobox', { name: 'Selector for attribute Status' }), 'unset');
		await modal.getByRole('button', { name: 'Apply' }).click();
		await expect(modal.getByText('Total results: 2')).toBeVisible();
		await modal.getByRole('button', { name: 'Run' }).click();
		await expect(modal.getByRole('button', { name: 'Continue anyway' })).toBeVisible();
	});
});
