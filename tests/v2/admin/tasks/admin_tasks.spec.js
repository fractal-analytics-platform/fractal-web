import { expect, test } from '../../workflow_fixture.js';
import { waitModal, waitModalClosed, waitPageLoading } from '../../../utils/utils.js';
import * as fs from 'fs';
import { createFakeTask, deleteTask } from '../../../utils/v2/task.js';

test('Tasks admin page [v2]', async ({ page, workflow }) => {
	function randomInt() {
		return Math.floor(Math.random() * 1000);
	}
	// Generating a random task version, so that we can filter by version and have exactly 2 results
	const randomTaskVersion = `${randomInt()}.${randomInt()}.${randomInt()}`;

	let taskName1, taskName2;
	await test.step('Create test tasks', async () => {
		taskName1 = await createFakeTask(page, {
			type: 'non_parallel',
			version: randomTaskVersion
		});
		taskName2 = await createFakeTask(page, {
			type: 'non_parallel',
			version: randomTaskVersion
		});
	});

	await test.step('Open workflow page', async () => {
		await workflow.openWorkflowPage();
	});

	await test.step('Add task to workflow', async () => {
		await workflow.addTask(taskName1);
	});

	await test.step('Open tasks admin page', async () => {
		await page.goto('/v2/admin/tasks');
		await waitPageLoading(page);
	});

	await test.step('Search tasks without filters', async () => {
		await searchTasks(page);
		await expect(page.getByRole('table')).toBeVisible();
		const total = await page.getByRole('row').count();
		expect(total).toBeGreaterThan(0);
		await reset(page);
	});

	await test.step('Search task by core', async () => {
		await page.getByRole('textbox', { name: 'Version' }).fill(randomTaskVersion);
		await searchTasks(page);
		await page
			.getByRole('row', { name: taskName1 })
			.getByRole('button', { name: 'Make core' })
			.click();
		await page
			.getByRole('row', { name: taskName2 })
			.getByRole('button', { name: 'Make core' })
			.click();
		await expect(page.getByRole('button', { name: 'Make not core' })).toHaveCount(2);
		await reset(page);

		await page.getByRole('textbox', { name: 'Version' }).fill(randomTaskVersion);
		await page.getByRole('combobox', { name: 'Core' }).selectOption('true');
		await searchTasks(page);
		await expect(page.getByRole('row')).toHaveCount(3);

		await expect(page.getByRole('row', { name: taskName1 })).toBeVisible();
		await expect(page.getByRole('row', { name: taskName2 })).toBeVisible();

		await page.getByRole('checkbox', { name: 'Select all' }).check();
		await page.getByRole('button', { name: 'Make all not core' }).click();
		await searchTasks(page);
		await expect(page.getByRole('row')).toHaveCount(0);

		await reset(page);
	});

	await test.step('Search by private', async () => {
		await page.goto('/v2/tasks/management');
		await waitPageLoading(page);
		await page.getByRole('row', { name: taskName1 }).getByLabel('Edit').click();
		await page.locator('#taskGroupEditModal').getByText('Private task').click();
		await page.getByRole('button', { name: 'Update' }).click();

		await page.goto('/v2/admin/tasks');
		await waitPageLoading(page);

		await page.getByRole('textbox', { name: 'Version' }).fill(randomTaskVersion);
		await page.getByLabel('Private').selectOption('true');
		await searchTasks(page);
		await expect(page.getByRole('row')).toHaveCount(2);

		await page.goto('/v2/tasks/management');
		await waitPageLoading(page);
		await page.getByRole('row', { name: taskName1 }).getByLabel('Edit').click();
		await page.locator('#taskGroupEditModal').getByText('Shared task').click();
		await page.getByRole('button', { name: 'Update' }).click();

		await page.goto('/v2/admin/tasks');
		await waitPageLoading(page);
		await page.getByLabel('Private').selectOption('true');
		await searchTasks(page);
		await expect(page.getByRole('row')).toHaveCount(0);

		await reset(page);
	});

	await test.step('Search by active', async () => {
		await page.goto('/v2/tasks/management');
		await waitPageLoading(page);
		await page
			.getByRole('row', { name: taskName1 })
			.getByRole('button', { name: 'Manage' })
			.click();
		let modal = await waitModal(page);
		await modal.getByRole('button', { name: 'Deactivate task group' }).click();
		await modal.getByRole('button', { name: 'Confirm' }).click();
		await waitPageLoading(page);

		await page.goto('/v2/admin/tasks');
		await waitPageLoading(page);

		await page.getByRole('textbox', { name: 'Version' }).fill(randomTaskVersion);
		await page.getByLabel('Active').selectOption('false');
		await searchTasks(page);
		await expect(page.getByRole('row')).toHaveCount(2);

		await page.goto('/v2/tasks/management');
		await waitPageLoading(page);
		await page
			.getByRole('row', { name: taskName1 })
			.getByRole('button', { name: 'Manage' })
			.click();
		modal = await waitModal(page, false);
		await modal.getByRole('button', { name: 'Reactivate task group' }).click();
		await waitPageLoading(page);

		await page.goto('/v2/admin/tasks');
		await waitPageLoading(page);
		await page.getByLabel('Active').selectOption('false');
		await searchTasks(page);
		await expect(page.getByRole('row')).toHaveCount(0);

		await reset(page);
	});

	await test.step('Search by owner', async () => {
		await page.getByLabel('Owner').selectOption('guest@fractal.xy');
		await searchTasks(page);
		await expect(page.getByRole('row')).toHaveCount(0);

		await page.getByLabel('Owner').selectOption('admin@fractal.xy');
		await searchTasks(page);
		await expect(page.getByRole('row').first()).toBeVisible();
		expect(await page.getByRole('row').count()).toBeGreaterThan(0);

		await reset(page);
	});

	let id;
	await test.step('Search tasks by name', async () => {
		await page.getByRole('textbox', { name: 'Name', exact: true }).fill(taskName1);
		await searchTasks(page);
		await expect(page.getByRole('row')).toHaveCount(2);
		// Retrieve task id
		id = await page.getByRole('row').last().getByRole('cell').nth(1).innerText();
		await reset(page);
	});

	await test.step('Search tasks by id', async () => {
		await page.getByRole('spinbutton', { name: 'Id' }).fill(id);
		await searchTasks(page);
		await expect(page.getByRole('row')).toHaveCount(2);
		await reset(page);
	});

	await test.step('Search tasks by version', async () => {
		await page.getByRole('textbox', { name: 'Version' }).fill(randomTaskVersion);
		await searchTasks(page);
		await expect(page.getByRole('row')).toHaveCount(3);
	});

	await test.step('Download CSV', async () => {
		const downloadPromise = page.waitForEvent('download');
		await page.getByText('Download CSV').click();
		const download = await downloadPromise;
		const content = fs.readFileSync(await download.path(), 'utf8');
		const rowsCount = await page.locator('table tbody tr').count();
		expect(content.split('\n').length).toEqual(rowsCount + 1);
	});

	await test.step('Open info modal', async () => {
		await page.getByRole('row', { name: taskName1 }).getByRole('button', { name: 'Info' }).click();
		const modal = await waitModal(page);
		await modal.getByRole('button', { name: 'Task properties' }).click();
		await modal.getByText(taskName1).waitFor();
		await modal.getByRole('button', { name: 'Task properties' }).click();
		await modal.getByRole('button', { name: workflow.workflowName }).click();
		await modal.locator('#collapse-0').getByText(workflow.projectName).waitFor();
		await page.getByRole('button', { name: 'Close' }).click();
		await waitModalClosed(page);
	});

	await test.step('Search tasks by type', async () => {
		await reset(page);
		await page.getByRole('combobox', { name: 'Task type' }).selectOption('non_parallel');
		await searchTasks(page);
		await expect(page.getByRole('row', { name: 'generic_task' }).first()).toBeVisible();
	});

	await test.step('Cleanup test tasks', async () => {
		await workflow.delete();
		await deleteTask(page, taskName1);
	});
});

/**
 * @param {import('@playwright/test').Page} page
 */
async function searchTasks(page) {
	await page.getByRole('button', { name: 'Search tasks' }).click();
}

/**
 * @param {import('@playwright/test').Page} page
 */
async function reset(page) {
	await page.getByRole('button', { name: 'Reset' }).click();
	await expect(page.getByRole('table')).not.toBeVisible();
}
