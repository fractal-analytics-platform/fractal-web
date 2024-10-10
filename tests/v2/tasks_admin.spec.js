import { expect, test } from './workflow_fixture.js';
import { waitModalClosed, waitPageLoading } from '../utils.js';
import { createFakeTask, deleteTask } from './task_utils.js';

test('Tasks admin page [v2]', async ({ page, workflow }) => {
	await page.waitForURL(workflow.url);
	await waitPageLoading(page);

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

	/** @type {number} */
	let total;
	await test.step('Search tasks without filters', async () => {
		await searchTasks(page);
		await expect(page.getByRole('table')).toBeVisible();
		total = await page.getByRole('row').count();
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

	await test.step('Search tasks by common kind', async () => {
		await page.getByRole('combobox', { name: 'Kind' }).selectOption('Common');
		await searchTasks(page);
		await expect(page.getByRole('table')).toBeVisible();
		let count = await page.getByRole('row').count();
		expect(count).toBeLessThan(total);
		await page.getByRole('cell', { name: 'cellpose_segmentation', exact: true }).waitFor();
		await reset(page);
	});

	await test.step('Search tasks by users kind', async () => {
		await page.getByRole('combobox', { name: 'Kind' }).selectOption('Users');
		await searchTasks(page);
		await expect(page.getByRole('table')).toBeVisible();
		let count = await page.getByRole('row').count();
		expect(count).toBeLessThan(total);
		await page.getByText(taskName).waitFor();
		await reset(page);
	});

	await test.step('Search tasks by source', async () => {
		await page.getByRole('textbox', { name: 'Source' }).fill('cellpose_segmentation');
		await searchTasks(page);
		await expect(page.getByRole('row')).toHaveCount(2);
		await reset(page);
	});

	await test.step('Search tasks by version', async () => {
		await page.getByRole('textbox', { name: 'Version' }).fill(randomTaskVersion);
		await searchTasks(page);
		await expect(page.getByRole('row')).toHaveCount(2);
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

	await test.step('Cleanup test tasks', async () => {
		await workflow.openWorkflowPage();
		await workflow.selectTask(taskName);
		await workflow.removeCurrentTask();
		await deleteTask(page, taskName);
	});
});

/**
 * @param {import('@playwright/test').Page} page
 */
async function searchTasks(page) {
	// Increasing the results limit since during the tests many tasks may have been created
	await page.getByRole('spinbutton', { name: 'Max number of results' }).fill('500');
	await page.getByRole('button', { name: 'Search tasks' }).click();
}

/**
 * @param {import('@playwright/test').Page} page
 */
async function reset(page) {
	await page.getByRole('button', { name: 'Reset' }).click();
	await expect(page.getByRole('table')).not.toBeVisible();
}
