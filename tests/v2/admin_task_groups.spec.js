import { expect, test } from './workflow_fixture.js';
import { waitModalClosed, waitPageLoading } from '../utils.js';
import { createFakeTask } from './task_utils.js';

test('Task groups admin page [v2]', async ({ page, workflow }) => {
	await page.waitForURL(workflow.url);
	await waitPageLoading(page);

	let taskName;
	await test.step('Create test task group', async () => {
		taskName = await createFakeTask(page, {
			type: 'non_parallel'
		});
	});

	await test.step('Open task groups admin page', async () => {
		await page.goto('/v2/admin/task-groups');
		await waitPageLoading(page);
	});

	const taskRow = page.getByRole('row', { name: taskName });

	await test.step('Search without filters', async () => {
		await page.getByRole('button', { name: 'Search task groups' }).click();
		await expect(taskRow).toBeVisible();
		expect(await page.getByRole('row').count()).toBeGreaterThan(2);
	});

	await test.step('Filter test task', async () => {
		await page.getByRole('textbox', { name: 'Package name' }).fill(taskName);
		await page.getByRole('combobox', { name: 'User' }).selectOption('admin@fractal.xy');
		await page.getByRole('combobox', { name: 'Origin' }).selectOption('Other');
		await page.getByRole('combobox', { name: 'Origin' }).selectOption('Other');
		await page.getByRole('button', { name: 'Search task groups' }).click();
		await expect(taskRow).toBeVisible();
		expect(page.getByRole('row')).toHaveCount(2);
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

	await test.step('Delete task group', async () => {
		await taskRow.getByRole('button', { name: 'Delete' }).click();
		const modal = page.locator('.modal.show');
		await modal.waitFor();
		await modal.getByRole('button', { name: 'Confirm' }).click();
		await waitModalClosed(page);
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
