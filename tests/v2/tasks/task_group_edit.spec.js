import { expect, test } from '../workflow_fixture.js';
import { waitModalClosed, waitPageLoading } from '../../utils/utils.js';
import { createFakeTask, deleteTask } from '../../utils/v2/task.js';
import { addUserToGroup, createTestGroup, deleteGroup } from '../../utils/group.js';

test('Task group edit (change group)', async ({ page }) => {
	test.slow();

	const group = await createTestGroup(page);

	await test.step('Create test group1', async () => {
		await page.goto(`/v2/admin/groups/${group.id}/edit`);
		await waitPageLoading(page);
		await addUserToGroup(page, 'admin@fractal.xy');
	});

	let taskName;
	await test.step('Create test task group', async () => {
		taskName = await createFakeTask(page, {
			type: 'non_parallel'
		});
	});

	await test.step('Set the task to private', async () => {
		await page.goto('/v2/tasks/management');
		await waitPageLoading(page);
		const taskRow = page.getByRole('row', { name: taskName });
		await expect(taskRow.getByRole('cell').nth(3)).toContainText('All');
		await expect(taskRow.getByRole('cell').nth(1)).toContainText('admin@fractal.xy');
		await taskRow.getByRole('button', { name: 'Edit' }).click();
		const modal = page.locator('.modal.show');
		await modal.waitFor();
		await modal.getByText('Private task').click();
		await modal.getByRole('button', { name: 'Update' }).click();
		await waitModalClosed(page);
		await expect(taskRow.getByRole('cell').nth(3)).toContainText('-');
	});

	await test.step('Set the task to test group', async () => {
		const taskRow = page.getByRole('row', { name: taskName });
		await taskRow.getByRole('button', { name: 'Edit' }).click();
		const modal = page.locator('.modal.show');
		await modal.waitFor();
		await modal.getByText('Shared task').click();
		await modal.getByRole('combobox').selectOption(group.name);
		await modal.getByRole('button', { name: 'Update' }).click();
		await waitModalClosed(page);
		await expect(taskRow.getByRole('cell').nth(3)).toContainText(group.name);
	});

	await test.step('Cleanup', async () => {
		await deleteTask(page, taskName);
		await deleteGroup(page, group.id);
	});
});
