import { expect, test } from './workflow_fixture.js';
import { selectSlimSelect, waitModalClosed, waitPageLoading } from '../utils.js';
import { createDataset } from './dataset_utils.js';
import { waitTaskFailure, waitTasksSuccess } from './workflow_task_utils.js';

test('Workflow task runs', async ({ page, workflow }) => {
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

	await test.step('Open workflow page and configure tasks', async () => {
		await page.goto(workflow.url);
		await waitPageLoading(page);
		await workflow.addTask('create_ome_zarr_compound');
		await workflow.selectTask('create_ome_zarr_compound');
		await page.getByRole('textbox', { name: 'Image Dir' }).fill(zarrDir);
		await page.getByRole('spinbutton', { name: 'Num Images' }).fill('15');
		await workflow.addTask('illumination_correction');
		await workflow.addTask('cellpose_segmentation');
		await page.getByRole('button', { name: 'Save changes' }).click();
		await expect(page.getByRole('button', { name: 'Save changes' })).toBeDisabled();
	});

	await test.step('Add meta properties', async () => {
		await workflow.selectTask('cellpose_segmentation');
		await page.getByRole('button', { name: 'Meta', exact: true }).click();
		await page.getByRole('button', { name: 'Add property' }).click();
		await page.getByPlaceholder('Argument name').fill('k1');
		await page.getByPlaceholder('Argument value').fill('v1');
		await page.getByRole('button', { name: 'Save changes' }).click();
		await expect(page.getByRole('button', { name: 'Save changes' })).toBeDisabled();
	});

	await test.step('Run workflow', async () => {
		await page.getByRole('button', { name: 'Run workflow' }).click();
		await modal.waitFor();
		await modal.getByRole('button', { name: 'Run' }).click();
		await modal.getByRole('button', { name: 'Confirm' }).click();
		await waitModalClosed(page);
		await waitTasksSuccess(page);
	});

	await test.step('Open logs modal', async () => {
		await page.locator('[aria-label="Done images"]').last().click();
		await modal.waitFor();
		await expect(modal.getByText('Images')).toBeVisible();
		await expect(modal.getByText('Total results: 15')).toBeVisible();
		await modal.getByRole('button', { name: '2' }).click();
		await expect(modal.getByRole('row')).toHaveCount(11);
		await modal.getByRole('button', { name: 'Logs' }).last().click();
		await expect(modal.getByText("Logs for task 'cellpose_segmentation'")).toBeVisible();
		await modal.getByRole('button', { name: 'Back' }).click();
		await expect(modal.getByRole('row')).toHaveCount(6);
		await modal.getByRole('button', { name: 'Close' }).click();
		await waitModalClosed(page);
	});

	await test.step('Update meta properties', async () => {
		await page.getByRole('button', { name: 'Meta', exact: true }).click();
		await page.getByPlaceholder('Argument name').fill('k2');
		await page.getByPlaceholder('Argument value').fill('v2');
		await page.getByRole('button', { name: 'Save changes' }).click();
		await expect(page.getByRole('button', { name: 'Save changes' })).toBeDisabled();
	});

	await test.step('Continue workflow', async () => {
		await page.getByRole('button', { name: 'Continue workflow' }).click();
		await modal.waitFor();
		await modal.getByRole('combobox', { name: 'First task' }).selectOption('cellpose_segmentation');
		await modal.getByRole('button', { name: 'Image list' }).click();
		await selectSlimSelect(page, page.getByLabel('Selector for attribute well'), 'A02');
		await modal.getByRole('button', { name: 'Apply' }).click();
		await expect(modal.getByRole('button', { name: 'Apply' })).toBeDisabled();
		await modal.getByRole('button', { name: 'Run' }).click();
		await expect(modal.getByText('This job will process 1 image')).toBeVisible();
		await modal.getByRole('button', { name: 'Confirm' }).click();
		await waitModalClosed(page);
		await waitTasksSuccess(page);
	});

	await test.step('Open runs of last task and check meta', async () => {
		await page.getByRole('button', { name: 'Meta', exact: true }).click();
		await expect(page.getByPlaceholder('Argument name')).toHaveValue('k2');
		await expect(page.getByPlaceholder('Argument value')).toHaveValue('v2');
		await expect(page.getByRole('button', { name: 'Add property' })).toBeEnabled();
		await page.locator('[aria-label="Show runs"]').last().click();
		await page.getByRole('button', { name: 'Run 1' }).click();
		await expect(page.getByPlaceholder('Argument name')).toHaveValue('k1');
		await expect(page.getByPlaceholder('Argument value')).toHaveValue('v1');
		await expect(page.getByRole('button', { name: 'Add property' })).not.toBeEnabled();
		await page.getByRole('button', { name: 'Run 2' }).click();
		await expect(page.getByPlaceholder('Argument name')).toHaveValue('k2');
		await expect(page.getByPlaceholder('Argument value')).toHaveValue('v2');
		await expect(page.getByRole('button', { name: 'Add property' })).not.toBeEnabled();
	});

	await test.step('Open run logs modal', async () => {
		await page.locator('[aria-label="Done images"]').last().click();
		await modal.waitFor();
		await expect(modal.getByText('Run 2')).toBeVisible();
		await expect(modal.getByText('Total results: 1')).toBeVisible();
		await expect(modal.getByRole('row')).toHaveCount(2);
		await modal.getByRole('button', { name: 'Close' }).click();
		await waitModalClosed(page);
	});

	await test.step('Open runs of second task and check arguments', async () => {
		await workflow.selectTask('illumination_correction');
		await expect(page.getByRole('button', { name: 'Run 1' })).not.toBeVisible();
		await page.getByRole('button', { name: 'Arguments', exact: true }).click();
		await page.getByRole('switch').check();
		await page.getByRole('button', { name: 'Save changes' }).click();
		await expect(page.getByRole('button', { name: 'Save changes' })).toBeDisabled();
		await expect(page.getByRole('switch')).toBeChecked();
		await page.locator('[aria-label="Show runs"]').nth(1).click();
		await page.getByRole('button', { name: 'Run 1' }).click();
		await expect(page.getByRole('button', { name: 'Run 2' })).not.toBeVisible();
		await expect(page.getByRole('switch')).not.toBeChecked();
		await expect(page.getByRole('switch')).not.toBeEditable();
	});

	await test.step('Continue workflow causing failure', async () => {
		await page.getByRole('button', { name: 'Continue workflow' }).click();
		await modal.waitFor();
		await modal
			.getByRole('combobox', { name: 'First task' })
			.selectOption('create_ome_zarr_compound');
		await modal.getByRole('button', { name: 'Run' }).click();
		await modal.getByRole('button', { name: 'Confirm' }).click();
		await waitModalClosed(page);
		await waitTaskFailure(page);
	});

	await test.step('Open failed logs modal', async () => {
		await page.locator('[aria-label="Failed images"]').first().click();
		await modal.waitFor();
		await expect(modal.getByText('Images')).toBeVisible();
		await expect(modal.getByText('Total results: 15')).toBeVisible();
		await modal
			.getByRole('row', { name: 'failed' })
			.first()
			.getByRole('button', { name: 'Logs' })
			.click();
		await expect(modal.locator('.expandable-log')).toBeVisible();
		await expect(page.getByText("Logs for task 'create_ome_zarr_compound'")).toBeVisible();
		await modal.getByRole('button', { name: 'Close' }).click();
		await waitModalClosed(page);
	});
});
