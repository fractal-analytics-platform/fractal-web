import { expect, test } from './workflow_fixture.js';
import { waitModalClosed, waitPageLoading } from '../utils.js';
import { createFakeTask, deleteTask } from './task_utils.js';
import { addUserToGroup, createTestGroup, deleteGroup } from './group_utils.js';

test('Task group edit (change group)', async ({ page, workflow }) => {
	await page.waitForURL(workflow.url);
	await waitPageLoading(page);

	let groupName;
	await test.step('Create test group1', async () => {
		groupName = await createTestGroup(page);
		await addUserToGroup(page, 'admin@fractal.xy');
	});

	let taskName;
	await test.step('Create test task group', async () => {
		taskName = await createFakeTask(page, {
			type: 'non_parallel'
		});
	});

	await test.step('Set the task to private', async () => {
		const taskRow = page.getByRole('row', { name: taskName });
		await expect(taskRow.getByRole('cell').nth(2)).toContainText('All');
		await taskRow.getByRole('button', { name: 'Edit' }).click();
		const modal = page.locator('.modal.show');
		await modal.waitFor();
		await modal.getByText('Private task').click();
		await modal.getByRole('button', { name: 'Update' }).click();
		await waitModalClosed(page);
		await expect(taskRow.getByRole('cell').nth(2)).toContainText('-');
	});

	await test.step('Set the task to test group', async () => {
		const taskRow = page.getByRole('row', { name: taskName });
		await taskRow.getByRole('button', { name: 'Edit' }).click();
		const modal = page.locator('.modal.show');
		await modal.waitFor();
		await modal.getByText('Shared task').click();
		await modal.getByRole('combobox').selectOption(groupName);
		await modal.getByRole('button', { name: 'Update' }).click();
		await waitModalClosed(page);
		await expect(taskRow.getByRole('cell').nth(2)).toContainText(groupName);
	});

	await test.step('Cleanup', async () => {
		await deleteTask(page, taskName);
		await deleteGroup(page, groupName);
	});
});
