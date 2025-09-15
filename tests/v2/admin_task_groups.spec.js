import { expect, test } from './workflow_fixture.js';
import { waitModalClosed, waitPageLoading } from '../utils.js';
import { createFakeTask } from './task_utils.js';

test('Task groups admin page [v2]', async ({ page, workflow }) => {
	await page.waitForURL(workflow.url);
	await waitPageLoading(page);

	let taskName;
	await test.step('Create test task group', async () => {
		taskName = await createFakeTask(page, {
			type: 'non_parallel',
			version: '0.0.1'
		});
		await createFakeTask(page, {
			name: taskName,
			type: 'non_parallel',
			version: '0.0.2'
		});
	});

	await test.step('Open task groups admin page', async () => {
		await page.goto('/v2/admin/task-groups');
		await waitPageLoading(page);
	});

	const taskRow = page.getByRole('row', { name: new RegExp('.*' + taskName + '.*0.0.1.*') });

	await test.step('Search without filters', async () => {
		await page.getByRole('button', { name: 'Search task groups' }).click();
		await expect(taskRow).toBeVisible();
		expect(await page.getByRole('row').count()).toBeGreaterThan(2);
	});

	await test.step('Filter test task', async () => {
		await filterTestTasks(page, taskName);
		await expect(taskRow).toBeVisible();
		await expect(page.getByRole('row')).toHaveCount(3);
	});

	await test.step('Open info modal', async () => {
		await taskRow.getByRole('button', { name: 'Info' }).click();
		const modal = page.locator('.modal.show');
		await modal.waitFor();
		await expect(modal).toContainText(taskName);
		await modal.getByRole('button', { name: 'Close' }).click();
		await waitModalClosed(page);
	});

	await test.step('Open edit modal and set task group to private', async () => {
		const groupCell = taskRow.getByRole('cell').nth(4);
		await expect(groupCell).toHaveText('All');
		await taskRow.getByRole('button', { name: 'Edit' }).click();
		const modal = page.locator('.modal.show');
		await modal.waitFor();
		await modal.getByText('Private task').click();
		await modal.getByRole('button', { name: 'Update' }).click();
		await waitModalClosed(page);
		await expect(groupCell).toHaveText('-');
	});

	await test.step('Delete task group 0.0.1', async () => {
		await taskRow.getByRole('button', { name: 'Manage' }).click();
		const modal = page.locator('.modal.show');
		await modal.waitFor();
		await expect(modal).toContainText('0.0.1');
		await modal.getByRole('button', { name: 'Delete task group' }).click();
		await modal.getByRole('button', { name: 'Confirm delete' }).click();
		await waitModalClosed(page);
		await page.waitForURL(/\/v2\/admin\/task-groups\/activities\?activity_id=\d+/);
		await waitPageLoading(page);
		await expect(page.getByRole('row', { name: taskName })).toContainText('delete');
	});

	await test.step('Go back to tasks management page', async () => {
		await page.goto('/v2/admin/task-groups');
		await waitPageLoading(page);
		await filterTestTasks(page, taskName);
		await expect(page.getByRole('row')).toHaveCount(2);
		await expect(page.getByText('The query returned 1 matching result')).toBeVisible();
	});

	await test.step('Delete task group 0.0.2', async () => {
		const taskRow2 = page.getByRole('row', { name: taskName });
		await taskRow2.getByRole('button', { name: 'Manage' }).click();
		const modal = page.locator('.modal.show');
		await modal.waitFor();
		await modal.waitFor();
		await expect(modal).toContainText('0.0.2');
		await modal.getByRole('button', { name: 'Delete task group' }).click();
		await modal.getByRole('button', { name: 'Confirm delete' }).click();
		await waitModalClosed(page);
		await page.waitForURL(/\/v2\/admin\/task-groups\/activities\?activity_id=\d+/);
		await waitPageLoading(page);
		await expect(page.getByRole('row', { name: taskName })).toContainText('delete');
	});

	await test.step('Go back to tasks management page', async () => {
		await page.goto('/v2/admin/task-groups');
		await waitPageLoading(page);
		await filterTestTasks(page, taskName);
		await expect(page.getByText('The query returned 0 matching results')).toBeVisible();
	});

	await test.step('Search by date', async () => {
		await page.getByText('Reset').click();
		await expect(page.getByText('The query returned 0 matching results')).not.toBeVisible();
		await page.locator('#last_used_date_min').fill('2020-01-01');
		await page.locator('#last_used_time_min').fill('10:00');
		await page.locator('#last_used_date_max').fill('2020-01-03');
		await page.locator('#last_used_time_max').fill('23:00');
		await page.getByRole('button', { name: 'Search task groups' }).click();
		await expect(page.getByText('The query returned 0 matching results')).toBeVisible();
		await page.getByText('Reset').click();
		await expect(page.locator('#last_used_date_min')).toHaveValue('');
		await expect(page.locator('#last_used_time_min')).toHaveValue('');
		await expect(page.locator('#last_used_date_max')).toHaveValue('');
		await expect(page.locator('#last_used_time_max')).toHaveValue('');
	});
});

/**
 * @param {import('@playwright/test').Page} page
 * @param {string} taskName
 */
async function filterTestTasks(page, taskName) {
	await page.getByRole('textbox', { name: 'Package name' }).fill(taskName);
	await page.getByRole('combobox', { name: 'User' }).selectOption('admin@fractal.xy');
	await page.getByRole('combobox', { name: 'Origin' }).selectOption('Other');
	await page.getByRole('combobox', { name: 'Origin' }).selectOption('Other');
	await page.getByRole('button', { name: 'Search task groups' }).click();
}
