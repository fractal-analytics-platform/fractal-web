import { expect, test } from './workflow_fixture.js';
import { waitPageLoading } from '../utils.js';
import { createFakeTask, deleteTask } from './task_utils.js';

test('Workflow task input filters [v2]', async ({ page, workflow }) => {
	await page.waitForURL(workflow.url);
	await waitPageLoading(page);

	let taskName;
	await test.step('Create test task', async () => {
		taskName = await createFakeTask(page, { type: 'non_parallel' });
	});

	await test.step('Open workflow page', async () => {
		await workflow.openWorkflowPage();
	});

	await test.step('Add task to workflow', async () => {
		await workflow.addUserTask(taskName);
		await workflow.selectTask(taskName);
	});

	await test.step('Open Input Filters tab', async () => {
		await page.getByText('Input Filters').click();
	});

	await test.step('Add empty attribute filter and trigger validation', async () => {
		await page.getByRole('button', { name: 'Add attribute filter' }).click();
		await page.getByRole('button', { name: 'Save' }).click();
		await page.getByText('Key is required').waitFor();
	});

	await test.step('Add valid filters', async () => {
		await page.getByPlaceholder('Key').fill('key1');
		await page.getByPlaceholder('Value').fill('value1');
		await page.getByRole('button', { name: 'Add type filter' }).click();
		await page.getByPlaceholder('Key').nth(1).fill('key2');
		await page.getByRole('button', { name: 'Save' }).click();
		await page.getByText('Input filters successfully updated').waitFor();
	});

	await test.step('Reload the page and check save filters', async () => {
		await page.reload();
		await workflow.selectTask(taskName);
		await page.getByText('Input Filters').click();
		await expect(page.getByPlaceholder('Key').first()).toHaveValue('key1');
		await expect(page.getByPlaceholder('Value').first()).toHaveValue('value1');
		await expect(page.getByPlaceholder('Key').nth(1)).toHaveValue('key2');
	});

	await test.step('Cleanup', async () => {
		await workflow.removeCurrentTask();
		await deleteTask(page, taskName);
	});
});
