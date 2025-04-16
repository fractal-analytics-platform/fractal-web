import { expect, test } from './workflow_fixture.js';
import { waitModalClosed, waitPageLoading } from '../utils.js';
import { createDataset } from './dataset_utils.js';
import { createImage } from './image_utils.js';
import { waitTaskSubmitted, waitTasksSuccess } from './workflow_task_utils.js';

test('Continue workflow displays image lists [#693]', async ({ page, workflow }) => {
	await page.waitForURL(workflow.url);
	await waitPageLoading(page);

	let datasetName;
	await test.step('Create test dataset and open dataset page', async () => {
		const { name } = await createDataset(page, workflow.projectId);
		datasetName = name;
		await page.getByRole('link', { name: datasetName }).click();
		await waitPageLoading(page);
	});

	await test.step('Create test image', async () => {
		await createImage(page, `/tmp/playwright/datasets/${datasetName}/img1`, { a1: 'v1' });
	});

	await test.step('Run workflow', async () => {
		await page.goto(workflow.url);
		await waitPageLoading(page);
		await workflow.addTask('generic_task');
		await page.getByRole('button', { name: 'Run workflow' }).click();
		const modal = page.locator('.modal.show');
		await modal.waitFor();
		await expect(modal.getByRole('button', { name: 'Image list' })).toBeVisible();
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

	await test.step('Reload the page', async () => {
		await page.reload();
	});

	await test.step('Open "Continue workflow" modal', async () => {
		await page.getByRole('button', { name: 'Continue workflow' }).click();
		const modal = page.locator('.modal.show');
		await modal.waitFor();
		await modal.getByRole('combobox', { name: 'Start workflow at' }).selectOption('generic_task');
		await expect(modal.getByRole('button', { name: 'Image list' })).toBeVisible();
	});
});
