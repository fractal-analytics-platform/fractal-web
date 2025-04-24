import { expect, test } from './workflow_fixture.js';
import { waitModalClosed, waitPageLoading } from '../utils.js';
import { createDataset } from './dataset_utils.js';
import { waitTasksSuccess } from './workflow_task_utils.js';

test('Workflow task - Show Zarr URLs button', async ({ page, workflow }) => {
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
		await workflow.addTask('illumination_correction');
		await workflow.addTask('MIP_compound');
		await workflow.selectTask('create_ome_zarr_compound');
		await page.getByRole('textbox', { name: 'Image Dir' }).fill(zarrDir);
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

	await test.step('Open MIP_compound run', async () => {
		await page.getByRole('button', { name: 'Show runs' }).last().click();
		await page.getByRole('button', { name: 'Done images' }).last().click();
		await modal.waitFor();
		await expect(modal.getByText('Run 1')).toBeVisible();
		await expect(modal.getByText('Total results: 3')).toBeVisible();
		await expect(modal.getByRole('row')).toHaveCount(5);
		await expect(modal.getByRole('row').last().getByRole('cell').nth(2)).toContainText(
			'my_plate.zarr/A/02/0_corr'
		);
	});

	await test.step('Show Zarr URLs subpage', async () => {
		await modal.getByRole('row').nth(2).getByRole('button', { name: 'Zarr URLs' }).click();
		await expect(modal.getByRole('row')).toHaveCount(2);
		await expect(modal.getByRole('row').first()).toContainText('my_plate.zarr/A/01/0_corr');
		await modal.getByRole('button', { name: 'Back' }).click();
		await expect(modal.getByRole('row')).toHaveCount(5);
	});
});
