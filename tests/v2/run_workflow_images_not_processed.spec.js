import { waitModalClosed, waitPageLoading } from '../utils.js';
import { createImage } from './image_utils.js';
import { expect, test } from './workflow_fixture.js';
import { waitTaskFailure, waitTaskSubmitted } from './workflow_task_utils.js';

test('Display not processed images warning', async ({ page, workflow }) => {
	await page.waitForURL(workflow.url);
	await waitPageLoading(page);

	await page.goto(`/v2/projects/${workflow.projectId}`);
	await waitPageLoading(page);

	const randomPath = `/tmp/${Math.random().toString(36).substring(7)}`;
	const modal = page.locator('.modal.show');

	await test.step('Create test dataset', async () => {
		const createDatasetButton = page.getByRole('button', { name: 'Create new dataset' });
		await createDatasetButton.click();
		await modal.waitFor();
		await modal.getByRole('textbox', { name: 'Dataset Name' }).fill('test-dataset');
		await modal.getByRole('textbox', { name: 'Zarr dir' }).fill(randomPath);
		await modal.getByRole('button', { name: 'Save' }).click();
		await waitModalClosed(page);
	});

	await test.step('Open test dataset', async () => {
		await page.getByRole('link', { name: 'test-dataset' }).click();
		await page.waitForURL(/\/v2\/projects\/\d+\/datasets\/\d+/);
		await expect(page.getByText('No entries in the image list yet')).toBeVisible();
	});

	await test.step('Create test images', async () => {
		await createImage(page, `${randomPath}/A`);
		await createImage(page, `${randomPath}/B`);
	});

	await test.step('Open workflow page and configure workflow', async () => {
		await page.goto(workflow.url);
		await waitPageLoading(page);
		await workflow.addTask('generic_task');
		await workflow.selectTask('generic_task');
		// Set "Raise Error" to true
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

	await test.step('Add another task', async () => {
		await workflow.addTask('generic_task_parallel');
	});

	await test.step('Continue workflow selecting the last task', async () => {
		await page.getByRole('button', { name: 'Continue workflow' }).click();
		const modal = page.locator('.modal.show');
		await modal.waitFor();
		await modal
			.getByRole('combobox', { name: 'Start workflow at' })
			.selectOption('generic_task_parallel');
		await modal.getByRole('button', { name: 'Run', exact: true }).click();
		await expect(
			modal.getByText(
				'You are trying to run the generic_task_parallel task on images that were not run on the prior generic_task task.'
			)
		).toBeVisible();
		await modal.getByRole('button', { name: 'Continue anyway' }).click();
		await expect(modal.getByText('This job will process 2 images.')).toBeVisible();
	});
});
