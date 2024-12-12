import { expect, test } from './workflow_fixture.js';
import { waitPageLoading } from '../utils.js';
import { createFakeTask, deleteTask } from './task_utils.js';

test('Update version of deactivated task', async ({ page, workflow }) => {
	await page.waitForURL(workflow.url);
	await waitPageLoading(page);

	test.slow();

	let taskName;

	await test.step('Create test tasks', async () => {
		taskName = await createFakeTask(page, {
			type: 'non_parallel',
			version: '0.0.1',
			args_schema_non_parallel: {
				properties: {
					p1: { type: 'string' }
				},
				type: 'object'
			}
		});
		await createFakeTask(page, {
			name: taskName,
			type: 'non_parallel',
			version: '0.0.2',
			args_schema_non_parallel: {
				properties: {
					p1: { type: 'string' }
				},
				type: 'object'
			}
		});
	});

	await test.step('Open workflow page', async () => {
		await workflow.openWorkflowPage();
	});

	await test.step('Add v0.0.1 task', async () => {
		await workflow.addTask(taskName, '0.0.1');
	});

	await test.step('Deactivate the task', async () => {
		await page.goto('/v2/tasks/management');
		await waitPageLoading(page);
		await page.getByRole('row', { name: taskName }).getByRole('combobox').selectOption('0.0.1');
		await page.getByRole('row', { name: taskName }).getByRole('button', { name: 'Manage' }).click();
		const modal = page.locator('.modal.show');
		await modal.waitFor();
		await expect(modal.getByText('The task group is currently active')).toBeVisible();
		await modal.getByText('active').click();
		await modal.getByRole('button', { name: 'Deactivate task group' }).click();
		await modal.getByRole('button', { name: 'Confirm' }).click();
	});

	await test.step('Verify that task has been deactivated', async () => {
		await page.waitForURL(/\/v2\/tasks\/activities\?activity_id=\d+/);
		await waitPageLoading(page);
		await expect(page.getByRole('row')).toHaveCount(2);
		await expect(page.getByRole('row', { name: taskName })).toContainText('deactivate');
		await expect(page.getByRole('row', { name: taskName })).toContainText('OK');
	});

	await test.step('Update task to v2', async () => {
		await page.goto(workflow.url);
		await waitPageLoading(page);
		await workflow.selectTask(taskName);
		await expect(page.getByText(/Task is not active/)).toBeVisible();
		await page.getByRole('button', { name: 'Version' }).click();
		await page
			.getByRole('combobox', { name: /New versions of this task exist/ })
			.selectOption('0.0.2');
		await page.getByRole('button', { name: 'Update' }).click();
		await expect(page.getByText('No new versions available')).toBeVisible();
	});

	await test.step('Cleanup test tasks', async () => {
		await workflow.removeCurrentTask();
		await deleteTask(page, taskName); // 0.0.2
		await deleteTask(page, taskName); // 0.0.1
	});
});
