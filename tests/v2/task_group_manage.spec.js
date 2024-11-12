import { expect, test } from './workflow_fixture.js';
import { waitPageLoading } from '../utils.js';
import { createFakeTask, deleteTask } from './task_utils.js';

test('Task group manage (deactivate / reactivate)', async ({ page, workflow }) => {
	await page.waitForURL(workflow.url);
	await waitPageLoading(page);

	let taskName;
	await test.step('Create test task group', async () => {
		taskName = await createFakeTask(page, {
			type: 'non_parallel'
		});
	});

	await test.step('Deactivate the task', async () => {
		await page.getByRole('row', { name: taskName }).getByRole('button', { name: 'Manage' }).click();
		const modal = page.locator('.modal.show');
		await modal.waitFor();
		await modal.getByText('active').click();
		await modal.getByRole('button', { name: 'Update' }).click();
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
		const modal = page.locator('.modal.show');
		await modal.waitFor();
		await modal.getByText('active').click();
		await modal.getByRole('button', { name: 'Update' }).click();
	});

	await test.step('Verify that page loads the proper activity', async () => {
		await page.waitForURL(/\/v2\/tasks\/activities\?activity_id=\d+/);
		await waitPageLoading(page);
		await expect(page.getByRole('row')).toHaveCount(2);
		await expect(page.getByRole('row', { name: taskName })).toContainText('reactivate');
	});

	await test.step('Cleanup', async () => {
		await deleteTask(page, taskName);
	});
});
