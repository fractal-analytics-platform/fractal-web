import { expect, test } from './workflow_fixture.js';
import { waitModalClosed, waitPageLoading } from '../utils.js';
import { createDataset } from './dataset_utils.js';
import { waitTasksSuccess } from './workflow_task_utils.js';
import { createFakeTask, deleteTask } from './task_utils.js';

test('Workflow task runs on task without arguments', async ({ page, workflow }) => {
	await page.waitForURL(workflow.url);
	await waitPageLoading(page);

	test.slow();

	const modal = page.locator('.modal.show');

	await test.step('Create test dataset', async () => {
		await createDataset(page, workflow.projectId);
	});

	/** @type {string} */
	let taskName;

	await test.step('Create test tasks', async () => {
		taskName = await createFakeTask(page, {
			type: 'non_parallel',
			version: '0.0.1',
			command_non_parallel: 'echo'
		});
	});

	await test.step('Prepare workflow', async () => {
		await page.goto(workflow.url);
		await waitPageLoading(page);
		await workflow.addTask(taskName);
		await workflow.selectTask(taskName);
		await page.getByRole('button', { name: 'Add property' }).click();
		await page.getByRole('textbox', { name: 'Argument name' }).fill('key');
		await page.getByRole('textbox', { name: 'Argument value' }).fill('foo');
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

	await test.step('Update arguments', async () => {
		await page.getByRole('textbox', { name: 'Argument value' }).fill('bar');
		await page.getByRole('button', { name: 'Save changes' }).click();
		await expect(page.getByText('Arguments changes saved successfully')).toBeVisible();
	});

	await test.step('Run workflow again', async () => {
		await page.getByRole('button', { name: 'Continue workflow' }).click();
		await modal.waitFor();
		await modal.getByRole('combobox', { name: 'Start workflow at' }).selectOption(taskName);
		await modal.getByRole('button', { name: 'Run', exact: true }).click();
		await modal.getByRole('button', { name: 'Confirm' }).click();
		await waitModalClosed(page);
		await waitTasksSuccess(page);
	});

	await test.step('Check run arguments', async () => {
		await page.getByLabel('Show runs').click();
		await page.getByRole('button', { name: 'Run 1' }).click();
		await expect(page.getByRole('textbox', { name: 'Argument value' })).toHaveValue('foo');
		await page.getByRole('button', { name: 'Run 2' }).click();
		await expect(page.getByRole('textbox', { name: 'Argument value' })).toHaveValue('bar');
	});

	await test.step('Cleanup', async () => {
		await workflow.removeCurrentTask();
		await deleteTask(page, taskName);
	});
});
