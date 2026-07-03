import { expect } from '@playwright/test';
import { test } from '../../base_fixture';
import { expectBooleanIcon, waitModal, waitPageLoading } from '../../utils/utils.js';
import { createFakeTask, deleteTask } from '../../utils/v2/task.js';
import { createProject } from '../../utils/v2/project';
import { createWorkflow } from '../../utils/v2/workflow';

test('Task group manage (deactivate / reactivate)', async ({ page }) => {
	let taskName;
	await test.step('Create test task group', async () => {
		taskName = await createFakeTask(page, {
			type: 'non_parallel'
		});
	});

	await test.step('Deactivate the task', async () => {
		await page.goto('/v2/tasks/management');
		await waitPageLoading(page);
		await page.getByRole('row', { name: taskName }).getByRole('button', { name: 'Manage' }).click();
		const modal = await waitModal(page);
		await expect(modal.getByText('The task group is currently active')).toBeVisible();
		await modal.getByText('active').click();
		await modal.getByRole('button', { name: 'Deactivate task group' }).click();
		await modal.getByRole('button', { name: 'Confirm' }).click();
	});

	await test.step('Verify that page loads the proper activity', async () => {
		await page.waitForURL(/\/v2\/tasks\/activities\?activity_id=\d+/);
		await waitPageLoading(page);
		await expect(page.getByRole('row')).toHaveCount(2);
		await expect(page.getByRole('row', { name: taskName })).toContainText('deactivate');
	});

	await test.step('Go back to previous page and reactivate the task', async () => {
		await page.goBack();
		await waitPageLoading(page);
		await page.getByRole('row', { name: taskName }).getByRole('button', { name: 'Manage' }).click();
		const modal = await waitModal(page, false);
		await modal.getByText('active').click();
		await modal.getByRole('button', { name: 'Reactivate task group' }).click();
	});

	await test.step('Verify that page loads the proper activity', async () => {
		await page.waitForURL(/\/v2\/tasks\/activities\?activity_id=\d+/);
		await waitPageLoading(page);
		await expect(page.getByRole('row')).toHaveCount(2);
		await expect(page.getByRole('row', { name: taskName })).toContainText('reactivate');
	});

	await test.step('Test task group in use', async () => {
		await page.goBack();
		await waitPageLoading(page);
		const row = page.getByRole('row', { name: taskName }).last();

		await expectBooleanIcon(row.getByRole('cell').nth(3), false);

		const project = await createProject(page);
		const workflow = await createWorkflow(page, project.id);

		await page.goto(`/v2/projects/${project.id}/workflows/${workflow.id}`);
		await page.getByRole('button', { name: 'Add task to workflow' }).click();
		await page.getByRole('row', { name: taskName }).getByLabel('Add task').click();
		await waitPageLoading(page);

		await page.goto('/v2/tasks/management');
		await waitPageLoading(page);

		const row2 = page.getByRole('row', { name: taskName }).last();
		await expectBooleanIcon(row2.getByRole('cell').nth(3), true);
	});

	await test.step('Cleanup', async () => {
		await deleteTask(page, taskName);
	});
});
