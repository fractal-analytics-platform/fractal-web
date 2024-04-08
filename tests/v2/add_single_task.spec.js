import { expect, test } from '@playwright/test';
import { waitModalClosed, waitPageLoading, waitStopSpinnerIn } from '../utils.js';
import { fileURLToPath } from 'url';
import path from 'path';
import { deleteTask } from './task_utils.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const validMetaFile = path.join(__dirname, '..', 'data', 'meta.json');
const validArgsSchemaFile = path.join(__dirname, '..', 'data', 'create-ome-zarr-schema.json');
const brokenJson = path.join(__dirname, '..', 'data', 'broken.json');
const invalidArgsSchema = path.join(__dirname, '..', 'data', 'invalid-schema.json');

test('Add single tasks [v2]', async ({ page }) => {
	await page.goto('/v2/tasks');
	await waitPageLoading(page);

	await test.step('Select "Add a single task" form', async () => {
		await page.getByText('Single task').click();
	});

	const createBtn = page.getByRole('button', { name: /^Create$/ });

	const randomTaskName1 = Math.random().toString(36).substring(7);

	await test.step('Create non parallel task', async () => {
		await page.getByRole('textbox', { name: 'Task name' }).fill(randomTaskName1);
		await page.getByRole('textbox', { name: 'Source' }).fill(`${randomTaskName1}-source`);
		await page.getByRole('textbox', { name: 'Command non parallel' }).fill('/tmp/test');
		await page.getByRole('button', { name: 'Add input type' }).click();
		await page.getByPlaceholder('Key').fill('input_type');
		await page.getByLabel('Value for input_type').check();
		await page.getByRole('button', { name: 'Add output type' }).click();
		await page.getByPlaceholder('Key').nth(1).fill('output_type');
		await page.getByRole('textbox', { name: 'Version' }).fill('0.0.1');
		await setUploadFile(page, 'Upload non parallel meta file', validMetaFile);
		await setUploadFile(page, 'Upload non parallel args schema', validArgsSchemaFile);
		await page.getByText('Documentation').click();
		await page.getByRole('textbox', { name: 'Docs info' }).fill('# Task title');
		await page.getByRole('textbox', { name: 'Docs link' }).fill('https://www.example.com');
		await createBtn.click();
		await page.getByText('Task created successfully').waitFor();

		const task = await getCreatedTaskModalData(page, randomTaskName1, 'non_parallel');
		expect(task.name).toEqual(randomTaskName1);
		expect(task.command_non_parallel).toEqual('/tmp/test');
		expect(task.source).toEqual(`admin:${randomTaskName1}-source`);
		expect(task.input_types).toContain('input_type');
		expect(task.output_types).toContain('output_type');
		expect(task.args_schema_version).toEqual('pydantic_v1');
		expect(task.docs_info).toEqual('Task title');
		expect(task.docs_link).toEqual('https://www.example.com');
	});

	const randomTaskName2 = Math.random().toString(36).substring(7);

	await test.step('Create parallel task', async () => {
		await page.getByText('Parallel', { exact: true }).click();

		await page.getByRole('textbox', { name: 'Task name' }).fill(randomTaskName2);
		await page.getByRole('textbox', { name: 'Source' }).fill(`${randomTaskName2}-source`);
		await page.getByRole('textbox', { name: 'Command parallel' }).fill('/tmp/test');
		await page.getByRole('button', { name: 'Add input type' }).click();
		await page.getByPlaceholder('Key').fill('input_type');
		await page.getByLabel('Value for input_type').check();
		await page.getByRole('button', { name: 'Add output type' }).click();
		await page.getByPlaceholder('Key').nth(1).fill('output_type');
		await page.getByRole('textbox', { name: 'Version' }).fill('0.0.1');
		await setUploadFile(page, 'Upload parallel meta file', validMetaFile);
		await setUploadFile(page, 'Upload parallel args schema', validArgsSchemaFile);
		await page.getByText('Documentation').click();
		await page.getByRole('textbox', { name: 'Docs info' }).fill('# Task title');
		await page.getByRole('textbox', { name: 'Docs link' }).fill('https://www.example.com');
		await createBtn.click();
		await page.getByText('Task created successfully').waitFor();

		const task = await getCreatedTaskModalData(page, randomTaskName2, 'parallel');
		expect(task.name).toEqual(randomTaskName2);
		expect(task.command_parallel).toEqual('/tmp/test');
		expect(task.source).toEqual(`admin:${randomTaskName2}-source`);
		expect(task.input_types).toContain('input_type');
		expect(task.output_types).toContain('output_type');
		expect(task.args_schema_version).toEqual('pydantic_v1');
		expect(task.docs_info).toEqual('Task title');
		expect(task.docs_link).toEqual('https://www.example.com');
	});

	const randomTaskName3 = Math.random().toString(36).substring(7);

	await test.step('Create compound task', async () => {
		await page.getByText('Compound', { exact: true }).click();

		await page.getByRole('textbox', { name: 'Task name' }).fill(randomTaskName3);
		await page.getByRole('textbox', { name: 'Source' }).fill(`${randomTaskName3}-source`);
		await page.getByRole('textbox', { name: 'Command non parallel' }).fill('/tmp/test-np');
		await page.getByRole('textbox', { name: 'Command parallel' }).fill('/tmp/test-p');
		await page.getByRole('button', { name: 'Add input type' }).click();
		await page.getByPlaceholder('Key').fill('input_type');
		await page.getByLabel('Value for input_type').check();
		await page.getByRole('button', { name: 'Add output type' }).click();
		await page.getByPlaceholder('Key').nth(1).fill('output_type');
		await page.getByRole('textbox', { name: 'Version' }).fill('0.0.1');
		await setUploadFile(page, 'Upload non parallel meta file', validMetaFile);
		await setUploadFile(page, 'Upload parallel meta file', validMetaFile);
		await setUploadFile(page, 'Upload non parallel args schema', validArgsSchemaFile);
		await setUploadFile(page, 'Upload parallel args schema', validArgsSchemaFile);
		await page.getByText('Documentation').click();
		await page.getByRole('textbox', { name: 'Docs info' }).fill('# Task title');
		await page.getByRole('textbox', { name: 'Docs link' }).fill('https://www.example.com');
		await createBtn.click();
		await page.getByText('Task created successfully').waitFor();

		const task = await getCreatedTaskModalData(page, randomTaskName3, 'compound');
		expect(task.name).toEqual(randomTaskName3);
		expect(task.command_non_parallel).toEqual('/tmp/test-np');
		expect(task.command_parallel).toEqual('/tmp/test-p');
		expect(task.source).toEqual(`admin:${randomTaskName3}-source`);
		expect(task.input_types).toContain('input_type');
		expect(task.output_types).toContain('output_type');
		expect(task.args_schema_version).toEqual('pydantic_v1');
		expect(task.docs_info).toEqual('Task title');
		expect(task.docs_link).toEqual('https://www.example.com');
	});

	const randomTaskName4 = Math.random().toString(36).substring(7);

	await test.step('Attempt to create task reusing task source', async () => {
		await page.getByRole('textbox', { name: 'Task name' }).fill(randomTaskName4);
		await page.getByRole('textbox', { name: 'Command non parallel' }).fill('/tmp/test-np');
		await page.getByRole('textbox', { name: 'Command parallel' }).fill('/tmp/test-p');
		await page.getByRole('textbox', { name: 'Source' }).fill(`${randomTaskName1}-source`);
		await createBtn.click();
		await page
			.getByText(`Source 'admin:${randomTaskName1}-source' already used by some TaskV2`)
			.waitFor();
	});

	await test.step('Attempt to create task with invalid fields', async () => {
		await setUploadFile(page, 'Upload non parallel meta file', brokenJson);
		await setUploadFile(page, 'Upload parallel meta file', brokenJson);
		await setUploadFile(page, 'Upload non parallel args schema', brokenJson);
		await setUploadFile(page, 'Upload parallel args schema', invalidArgsSchema);
		await createBtn.click();
		await page.getByText("File doesn't contain valid JSON").first().waitFor();
		expect(
			await page.getByText("File doesn't contain valid JSON", { exact: true }).count()
		).toEqual(3);
		await page
			.getByText('File doesn\'t contain valid JSON Schema: strict mode: unknown keyword: "foo"')
			.waitFor();
	});

	await test.step('Cleanup test tasks', async () => {
		await deleteTask(page, randomTaskName1);
		await deleteTask(page, randomTaskName2);
		await deleteTask(page, randomTaskName3);
	});
});

/**
 * @param {import('@playwright/test').Page} page
 * @param {string} taskName
 * @param {import('$lib/types-v2.js').TaskV2Type} taskType
 */
async function getCreatedTaskModalData(page, taskName, taskType) {
	const row = await getCreatedTaskRow(page, taskName);
	await row.getByRole('button', { name: 'Info' }).click();
	const modalTitle = page.locator('.modal.show .modal-title');
	await modalTitle.waitFor();
	await expect(modalTitle).toHaveText(`Task ${taskName}`);
	await waitStopSpinnerIn(page, '.modal.show');
	const items = await page.locator('.modal.show .modal-body').getByRole('listitem').all();
	let task;
	switch (taskType) {
		case 'non_parallel':
			task = getTaskDataNonParallel(items);
			break;
		case 'parallel':
			task = getTaskDataParallel(items);
			break;
		case 'compound':
			task = getTaskDataCompound(items);
			break;
		default:
			throw new Error('Invalid task type');
	}
	const closeModalBtn = page.locator('.modal.show').getByRole('button', { name: 'Close' }).first();
	await closeModalBtn.click();
	await waitModalClosed(page);
	return task;
}

/**
 * @param {import('@playwright/test').Locator[]} items
 */
async function getTaskDataNonParallel(items) {
	return {
		name: await items[1].innerText(),
		version: await items[3].innerText(),
		owner: await items[5].innerText(),
		command_non_parallel: await items[7].innerText(),
		source: await items[9].innerText(),
		input_types: await items[11].innerText(),
		output_types: await items[13].innerText(),
		args_schema_version: await items[15].innerText(),
		args_schema_non_parallel: await items[17].innerText(),
		docs_link: await items[19].innerText(),
		docs_info: await items[21].innerText()
	};
}

/**
 * @param {import('@playwright/test').Locator[]} items
 */
async function getTaskDataParallel(items) {
	return {
		name: await items[1].innerText(),
		version: await items[3].innerText(),
		owner: await items[5].innerText(),
		command_parallel: await items[7].innerText(),
		source: await items[9].innerText(),
		input_types: await items[11].innerText(),
		output_types: await items[13].innerText(),
		args_schema_version: await items[15].innerText(),
		args_schema_parallel: await items[17].innerText(),
		docs_link: await items[19].innerText(),
		docs_info: await items[21].innerText()
	};
}

/**
 * @param {import('@playwright/test').Locator[]} items
 */
async function getTaskDataCompound(items) {
	return {
		name: await items[1].innerText(),
		version: await items[3].innerText(),
		owner: await items[5].innerText(),
		command_non_parallel: await items[7].innerText(),
		command_parallel: await items[9].innerText(),
		source: await items[11].innerText(),
		input_types: await items[13].innerText(),
		output_types: await items[15].innerText(),
		args_schema_version: await items[17].innerText(),
		args_schema_parallel: await items[19].innerText(),
		args_schema_non_parallel: await items[21].innerText(),
		docs_link: await items[23].innerText(),
		docs_info: await items[25].innerText()
	};
}

/**
 * @param {import('@playwright/test').Page} page
 * @param {string} taskName
 * @returns {Promise<import('@playwright/test').Locator>}
 */
async function getCreatedTaskRow(page, taskName) {
	const table = page.getByRole('table').last();
	const rows = await table.getByRole('row').all();
	let taskRow;
	for (const row of rows) {
		const text = await row.getByRole('cell').first().innerText();
		if (text === taskName) {
			taskRow = row;
			break;
		}
	}
	expect(taskRow).not.toBeUndefined();
	return /** @type {import('@playwright/test').Locator} */ (taskRow);
}

/**
 * @param {import('@playwright/test').Page} page
 * @param {string} selectorText
 * @param {string} filePath
 */
async function setUploadFile(page, selectorText, filePath) {
	const fileChooserPromise = page.waitForEvent('filechooser');
	await page.getByText(selectorText).click();
	const fileChooser = await fileChooserPromise;
	await fileChooser.setFiles(filePath);
}
