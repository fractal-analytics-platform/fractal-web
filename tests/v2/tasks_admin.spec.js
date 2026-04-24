import { expect, test } from './workflow_fixture.js';
import { waitModalClosed, waitPageLoading } from '../utils/utils.js';
import * as fs from 'fs';
import { createFakeTask, deleteTask } from '../utils/v2/task.js';

test('Tasks admin page [v2]', async ({ page, workflow }) => {
	function randomInt() {
		return Math.floor(Math.random() * 1000);
	}
	// Generating a random task version, so that we can filter by version and have exactly one result
	const randomTaskVersion = `${randomInt()}.${randomInt()}.${randomInt()}`;

	let taskName;
	await test.step('Create test tasks', async () => {
		taskName = await createFakeTask(page, {
			type: 'non_parallel',
			version: randomTaskVersion
		});
	});

	await test.step('Open workflow page', async () => {
		await workflow.openWorkflowPage();
	});

	await test.step('Add task to workflow', async () => {
		await workflow.addTask(taskName);
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

	let id;
	await test.step('Search tasks by name', async () => {
		await page.getByRole('textbox', { name: 'Name' }).fill(taskName);
		await searchTasks(page);
		await expect(page.getByRole('row')).toHaveCount(2);
		// Retrieve task id
		id = await page.getByRole('row').last().getByRole('cell').first().innerText();
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
		await expect(page.getByRole('row')).toHaveCount(2);
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
		await page.getByRole('button', { name: 'Info' }).click();
		const modal = page.locator('.modal.show');
		await modal.waitFor();
		await modal.getByRole('button', { name: 'Task properties' }).click();
		await modal.getByText(taskName).waitFor();
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
		await expect(page.getByRole('row', { name: 'non_parallel' }).first()).toBeVisible();
	});

	await test.step('Cleanup test tasks', async () => {
		await workflow.delete();
		await deleteTask(page, taskName);
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
