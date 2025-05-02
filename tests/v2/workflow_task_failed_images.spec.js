import { expect, test } from './workflow_fixture.js';
import { waitModalClosed, waitPageLoading } from '../utils.js';
import { createDataset } from './dataset_utils.js';
import { waitTaskFailure, waitTasksSuccess } from './workflow_task_utils.js';

test('Workflow task with failed images', async ({ page, workflow }) => {
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

	await test.step('Continue workflow causing failure', async () => {
		await page.getByRole('button', { name: 'Continue workflow' }).click();
		await modal.waitFor();
		await modal.getByRole('combobox', { name: 'Start workflow at' }).selectOption('MIP_compound');
		await expect(modal.getByText('Total results: 2')).toBeVisible();
		await expect(modal.getByRole('button', { name: 'Apply' })).not.toBeEnabled();
		await modal.getByRole('button', { name: 'Run' }).click();
		await expect(modal.getByText('You are trying to run the MIP_compound task')).toBeVisible();
		await modal.getByRole('button', { name: 'Continue anyway' }).click();
		await modal.getByRole('button', { name: 'Confirm' }).click();
		await waitModalClosed(page);
		await waitTaskFailure(page);
	});

	await test.step('Open failed logs modal', async () => {
		await page.locator('[aria-label="Show runs"]').nth(1).click();
		await page.locator('[aria-label="Failed images"]').first().click();
		await modal.waitFor();
		await expect(modal.getByText('Images')).toBeVisible();
		await expect(modal.getByText('Total results: 2')).toBeVisible();
		await modal
			.getByRole('row', { name: 'failed' })
			.first()
			.getByRole('button', { name: 'Logs' })
			.click();
		await expect(modal.getByText(/click here to expand/)).toBeVisible();
		await expect(modal.getByText('FileExistsError')).toBeVisible();
		await modal.getByRole('button', { name: 'Close' }).click();
		await waitModalClosed(page);
	});
});
