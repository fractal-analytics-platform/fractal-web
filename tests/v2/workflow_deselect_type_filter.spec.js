import { expect, test } from './workflow_fixture.js';
import { expectSlimSelectValue, waitModalClosed, waitPageLoading } from '../utils.js';
import { createDataset } from './dataset_utils.js';
import { waitTasksSuccess } from './workflow_task_utils.js';

test('Continue workflow deseleting a pre-selected type filter', async ({ page, workflow }) => {
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
		await workflow.addTask('MIP_compound');
		await workflow.addTask('cellpose_segmentation');
		await workflow.selectTask('create_ome_zarr_compound');
		await page.getByRole('textbox', { name: 'Image Dir' }).fill(zarrDir);
		await page.getByRole('spinbutton', { name: 'Num Images' }).fill('2');
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

	await test.step('Open continue workflow modal and select cellpose_segmentation task', async () => {
		await page.getByRole('button', { name: 'Continue workflow' }).click();
		await modal.waitFor();
		await modal
			.getByRole('combobox', { name: 'Start workflow at' })
			.selectOption('cellpose_segmentation');
		await expect(page.getByText('Total results: 2')).toBeVisible();
		await expect(page.getByRole('row')).toHaveCount(4);
		await expectSlimSelectValue(page, 'Selector for type 3D', 'False');
	});

	await test.step('Deselect 3D type', async () => {
		await modal.getByLabel('Selector for type 3D').locator('.ss-deselect').click();
		await modal.getByRole('button', { name: 'Apply' }).click();
		await expect(modal.getByRole('button', { name: 'Apply' })).not.toBeEnabled();
		await expect(page.getByText('Total results: 4')).toBeVisible();
		await expect(page.getByRole('row')).toHaveCount(6);
	});

	await test.step('Click on "Run" and ignore warning. Verify that no filter is applied', async () => {
		await modal.getByRole('button', { name: 'Run' }).click();
		await modal.getByRole('button', { name: 'Continue anyway' }).click();
		await expect(modal.getByText('This job will process 4 images.')).toBeVisible();
		await expect(modal.getByText('Applied filters')).toBeVisible();
		await expect(modal.getByText('No filters')).toBeVisible();
	});
});
