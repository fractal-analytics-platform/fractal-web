import { expect, test } from '@playwright/test';
import { waitPageLoading } from '../../utils/utils.js';
import { createFakeTask, deleteTask } from '../../utils/v2/task.js';

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
		const modal = page.locator('.modal.show');
		await modal.waitFor();
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
		const modal = page.locator('.modal.show');
		await modal.waitFor();
		await modal.getByText('active').click();
		await modal.getByRole('button', { name: 'Reactivate task group' }).click();
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
