import { expect, test } from './workflow_fixture.js';
import { uploadFile, waitPageLoading } from '../utils.js';
import { deleteTask } from './task_utils.js';
import fs from 'fs';

test('Tasks V1/V2 Compatibility', async ({ page, workflow }) => {
	await page.waitForURL(workflow.url);
	await waitPageLoading(page);

	await test.step('Open Task page V1 and select "Add a single task"', async () => {
		await page.goto('/v1/tasks');
		await waitPageLoading(page);
		await page.getByText('Single task').click();
	});

	const randomTaskName = Math.random().toString(36).substring(7);

	let tmpFiles = [];
	await test.step('Create Task V1 v0.0.1', async () => {
		tmpFiles.push(await addTaskV1(page, randomTaskName, `${randomTaskName}-source1`, '0.0.1'));
	});
	await test.step('Create Task V1 v0.0.2', async () => {
		tmpFiles.push(await addTaskV1(page, randomTaskName, `${randomTaskName}-source2`, '0.0.2'));
	});

	await test.step('Open Admin Area V2', async () => {
		await page.goto('/v2/admin');
		await waitPageLoading(page);
	});

	await test.step('Open "Tasks V1/V2 compatibility" page', async () => {
		await page.getByText('Tasks V1/V2 compatibility').click();
		await page.waitForURL('/v2/admin/tasks-compatibility');
		await waitPageLoading(page);
	});

	await test.step('Set compatibility to V1 task v0.0.2', async () => {
		let rows = await page.getByRole('table').getByRole('row').all();
		let firstRowFound = false;
		for (const row of rows) {
			const rowTaskName = await row.getByRole('cell').nth(1).innerText();
			if (rowTaskName.trim() === randomTaskName) {
				firstRowFound = true;
				// Set compatibility to task v0.0.2
				const lastCell = row.getByRole('cell').last();
				await expect(lastCell).toContainText('false');
				await lastCell.getByRole('switch').click();
				await expect(lastCell).toContainText('true');
				// Expand old versions rows
				await row.getByRole('button', { name: 'Expand old versions' }).click();
				break;
			}
		}
		expect(firstRowFound).toBe(true);
	});

	await test.step('Set compatibility to V1 task v0.0.1', async () => {
		let firstRowFound = false;
		let secondRowFound = false;
		// Search the rows again
		const rows = await page.getByRole('table').getByRole('row').all();
		for (const row of rows) {
			const rowTaskName = await row.getByRole('cell').nth(1).innerText();
			if (firstRowFound) {
				expect(rowTaskName.trim()).toEqual('');
				// Set compatibility to task v0.0.1
				secondRowFound = true;
				const lastCell = row.getByRole('cell').last();
				await expect(lastCell).toContainText('false');
				await lastCell.getByRole('switch').click();
				await expect(lastCell).toContainText('true');
				break;
			}
			if (rowTaskName.trim() === randomTaskName) {
				firstRowFound = true;
			}
		}
		expect(secondRowFound).toBe(true);
	});

	await test.step('Open workflow page', async () => {
		await page.goto(workflow.url);
		await waitPageLoading(page);
	});

	await test.step('Add Task V1 v0.0.1 to workflow', async () => {
		await workflow.addUserTask(randomTaskName, 'v0.0.1', true);
		await workflow.selectTask(randomTaskName);
	});

	await test.step('Update Task V1 version to v0.0.2', async () => {
		await page.getByRole('button', { name: 'Version' }).click();
		await page
			.getByRole('combobox', { name: 'New versions of this task exist:' })
			.selectOption('0.0.2');
		await page.getByText('The arguments are valid').first().waitFor();
		await page.getByRole('button', { name: 'Update' }).click();
		await page.getByText('No new versions available').waitFor();
	});

	await test.step('Cleanup', async () => {
		await workflow.removeCurrentTask();
		await deleteTask(page, randomTaskName, 'v1');
		await deleteTask(page, randomTaskName, 'v1');
		for (const tmpFile of tmpFiles) {
			fs.rmSync(tmpFile);
		}
	});
});

/**
 * @param {import('@playwright/test').Page} page
 * @param {string} taskName
 * @param {string} sourceName
 * @param {string} version
 * @returns {Promise<string>} the path of the temporary args schema file
 */
async function addTaskV1(page, taskName, sourceName, version) {
	await page.getByRole('textbox', { name: 'Task name' }).fill(taskName);
	await page.getByRole('textbox', { name: 'Command' }).fill('/tmp/test');
	await page.getByRole('textbox', { name: 'Source' }).fill(sourceName);
	await page.getByRole('textbox', { name: 'Input Type' }).fill('Any');
	await page.getByRole('textbox', { name: 'Output Type' }).fill('Any');
	await page.getByRole('textbox', { name: 'Version' }).fill(version);
	const tmpFileArgsSchema = await uploadFile(page, 'Upload args schema', `${sourceName}.json`, {
		properties: {
			p1: { type: 'string' }
		},
		type: 'object'
	});
	await page.getByRole('button', { name: /^Create$/ }).click();
	await page.getByText('Task created successfully').waitFor();
	return tmpFileArgsSchema;
}
