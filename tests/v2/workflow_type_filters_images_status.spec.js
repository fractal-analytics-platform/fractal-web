import { expect, test } from './workflow_fixture.js';
import {
	expectSlimSelectValue,
	selectSlimSelect,
	waitModalClosed,
	waitPageLoading
} from '../utils.js';
import { createDataset } from './dataset_utils.js';
import { waitTasksSuccess } from './workflow_task_utils.js';

test('Workflow type filters selection in images status modal', async ({ page, workflow }) => {
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
		await workflow.addTask('cellpose_segmentation');
		await workflow.addTask('MIP_compound');
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

	await test.step('Open cellpose_segmentation images modal', async () => {
		await page.getByLabel('Done images').nth(1).click();
		await modal.waitFor();
		await expect(modal.getByLabel('Selector for type 3D')).toBeEnabled();
		await expect(modal.getByText('Total results: 4')).toBeVisible();
		await selectSlimSelect(page, modal.getByLabel('Selector for type 3D'), 'False');
		await modal.getByRole('button', { name: 'Apply' }).click();
		await expect(modal.getByText('Total results: 2')).toBeVisible();
		await modal.getByRole('button', { name: 'Close' }).click();
		await waitModalClosed(page);
	});

	await test.step('Open MIP_compound images modal', async () => {
		await page.getByLabel('Done images').nth(2).click();
		await modal.waitFor();
		await expect(modal.getByLabel('Selector for type 3D')).toHaveClass(/ss-disabled/);
		await expect(modal.getByText('Total results: 2')).toBeVisible();
		await expectSlimSelectValue(page, 'Selector for type 3D', 'True');
	});
});
