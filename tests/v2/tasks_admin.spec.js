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
		await workflow.addUserTask(taskName);
	});

	await test.step('Open tasks admin page', async () => {
		await page.goto('/v2/admin/tasks');
	});

	/** @type {number} */
	let total;
	await test.step('Search tasks without filters', async () => {
		await page.getByRole('button', { name: 'Search tasks' }).click();
		await expect(page.getByRole('table')).toBeVisible();
		total = await page.getByRole('row').count();
		expect(total).toBeGreaterThan(0);
		await page.getByRole('button', { name: 'Reset' }).click();
		await expect(page.getByRole('row')).toHaveCount(0);
	});

	let id;
	await test.step('Search tasks by name', async () => {
		await page.getByRole('textbox', { name: 'Name' }).fill(taskName);
		await page.getByRole('button', { name: 'Search tasks' }).click();
		await expect(page.getByRole('row')).toHaveCount(2);
		// Retrieve task id
		id = await page.getByRole('row').last().getByRole('cell').first().innerText();
		await page.getByRole('button', { name: 'Reset' }).click();
	});

	await test.step('Search tasks by id', async () => {
		await page.getByRole('spinbutton', { name: 'Id' }).fill(id);
		await page.getByRole('button', { name: 'Search tasks' }).click();
		await expect(page.getByRole('row')).toHaveCount(2);
		await page.getByRole('button', { name: 'Reset' }).click();
	});

	await test.step('Search tasks by common kind', async () => {
		await page.getByRole('combobox', { name: 'Kind' }).selectOption('Common');
		await page.getByRole('button', { name: 'Search tasks' }).click();
		await expect(page.getByRole('table')).toBeVisible();
		let count = await page.getByRole('row').count();
		expect(count).toBeLessThan(total);
		await page.getByRole('cell', { name: 'cellpose_segmentation', exact: true }).waitFor();
		await page.getByRole('button', { name: 'Reset' }).click();
	});

	await test.step('Search tasks by users kind', async () => {
		await page.getByRole('combobox', { name: 'Kind' }).selectOption('Users');
		await page.getByRole('button', { name: 'Search tasks' }).click();
		await expect(page.getByRole('table')).toBeVisible();
		let count = await page.getByRole('row').count();
		expect(count).toBeLessThan(total);
		await page.getByText(taskName).waitFor();
		await page.getByRole('button', { name: 'Reset' }).click();
	});

	await test.step('Search tasks by owner', async () => {
		await page.getByRole('combobox', { name: 'Owner' }).selectOption('admin');
		await page.getByRole('button', { name: 'Search tasks' }).click();
		await expect(page.getByRole('table')).toBeVisible();
		const count = await page.getByRole('row').count();
		expect(count).toBeLessThan(total);
		await page.getByRole('button', { name: 'Reset' }).click();
	});

	await test.step('Search tasks by source', async () => {
		await page.getByRole('textbox', { name: 'Source' }).fill('cellpose_segmentation');
		await page.getByRole('button', { name: 'Search tasks' }).click();
		await expect(page.getByRole('row')).toHaveCount(2);
		await page.getByRole('button', { name: 'Reset' }).click();
	});

	await test.step('Search tasks by version', async () => {
		await page.getByRole('textbox', { name: 'Version' }).fill(randomTaskVersion);
		await page.getByRole('button', { name: 'Search tasks' }).click();
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
