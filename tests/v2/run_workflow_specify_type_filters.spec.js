import { selectSlimSelect, waitModalClosed, waitPageLoading } from '../utils.js';
import { createDataset } from './dataset_utils.js';
import { expect, test } from './workflow_fixture.js';
import { waitTaskSubmitted, waitTasksSuccess } from './workflow_task_utils.js';

test('Warning message "You are trying to run a workflow without specifying what type of images should be processed"', async ({
	page,
	workflow
}) => {
	await page.waitForURL(workflow.url);
	await waitPageLoading(page);

	await page.goto(`/v2/projects/${workflow.projectId}`);
	await waitPageLoading(page);

	const modal = page.locator('.modal.show');

	let zarrDir;

	await test.step('Create test dataset', async () => {
		const dataset = await createDataset(page, workflow.projectId);
		zarrDir = dataset.zarrDir;
	});

	await test.step('Prepare workflow', async () => {
		await page.goto(workflow.url);
		await waitPageLoading(page);
		await workflow.addTask('create_ome_zarr_compound');
		await workflow.addTask('cellpose_segmentation');
		await workflow.addTask('MIP_compound');
		await workflow.selectTask('create_ome_zarr_compound');
		await page.getByRole('textbox', { name: 'Image Dir' }).fill(zarrDir);
		await page.getByRole('button', { name: 'Save changes' }).click();
		await page.getByText('Arguments changes saved successfully').waitFor();
	});

	await test.step('Run workflow', async () => {
		await page.getByRole('button', { name: 'Run workflow' }).click();
		await modal.waitFor();
		await modal.getByRole('button', { name: 'Run', exact: true }).click();
		await modal.getByRole('button', { name: 'Confirm' }).click();
		await waitModalClosed(page);
		await waitTaskSubmitted(page);
		await waitTasksSuccess(page);
	});

	await test.step('Trigger type filters warning message', async () => {
		await page.getByRole('button', { name: 'Continue workflow' }).click();
		await modal.waitFor();
		await modal
			.getByRole('combobox', { name: 'Start workflow at' })
			.selectOption('cellpose_segmentation');
		await expect(modal.getByText('Total results: 4')).toBeVisible();
		await modal.getByRole('button', { name: 'Run', exact: true }).click();
		await expect(
			modal.getByText(/You are trying to run a workflow without specifying what type/)
		).toBeVisible();
	});

	await test.step('Continue anyway and back', async () => {
		await modal.getByRole('button', { name: 'Continue anyway' }).click();
		await expect(modal.getByText('This job will process 4 images.')).toBeVisible();
		await modal.getByRole('button', { name: 'Cancel' }).click();
		await expect(modal.getByText('Total results: 4')).toBeVisible();
		await modal.getByRole('button', { name: 'Run', exact: true }).click();
		await expect(
			modal.getByText(/You are trying to run a workflow without specifying what type/)
		).toBeVisible();
	});

	await test.step('Select type', async () => {
		await selectSlimSelect(page, modal.getByRole('combobox', { name: 'Selector for type 3D' }), 'True');
		await modal.getByRole('button', { name: 'Apply' }).click();
		await expect(modal.getByText('Total results: 2')).toBeVisible();
		await modal.getByRole('button', { name: 'Run', exact: true }).click();
		await expect(modal.getByText(/the following filters are applied/)).toBeVisible();
		await expect(
			modal.locator('li').filter({ hasText: '3D:' }).locator('[aria-checked="true"]')
		).toBeVisible();
	});
});
