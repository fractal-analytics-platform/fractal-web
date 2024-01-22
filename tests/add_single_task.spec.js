import { expect, test, waitPageLoading } from './base_test.js';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test('Add single tasks', async ({ page }) => {
	await page.goto('/tasks');
	await waitPageLoading(page);

	await test.step('Select "Add a single task" form', async () => {
		await page.getByText('Single task').click();
	});

	const createBtn = page.getByRole('button', { name: /^Create$/ });

	const randomTaskName1 = Math.random().toString(36).substring(7);

	await test.step('Successful creation with required fields', async () => {
		await page.getByRole('textbox', { name: 'Task name' }).fill(randomTaskName1);
		await page.getByRole('textbox', { name: 'Command' }).fill('/tmp/test');
		await page.getByRole('textbox', { name: 'Source' }).fill(`${randomTaskName1}-source`);
		await page.getByRole('textbox', { name: 'Input Type' }).fill('image');
		await page.getByRole('textbox', { name: 'Output Type' }).fill('zarr');

		await createBtn.click();
		expect(await page.getByText('field required').count()).toEqual(0);
		await page.getByText('Task created successfully').waitFor();

		const task = await getCreatedTaskModalData(page, randomTaskName1);
		expect(task.name).toEqual(randomTaskName1);
		expect(task.command).toEqual('/tmp/test');
		expect(task.source).toEqual(`admin:${randomTaskName1}-source`);
		expect(task.input_type).toEqual('image');
		expect(task.output_type).toEqual('zarr');
		expect(task.args_schema).toEqual('-');
		expect(task.args_schema_version).toEqual('-');
		expect(task.docs_info).toEqual('-');
		expect(task.docs_link).toEqual('-');
	});

	const randomTaskName2 = Math.random().toString(36).substring(7);

	await test.step('Task source already in use', async () => {
		await page.getByRole('textbox', { name: 'Task name' }).fill(randomTaskName2);
		await page.getByRole('textbox', { name: 'Command' }).fill('/tmp/test');
		await page.getByRole('textbox', { name: 'Source' }).fill(`${randomTaskName1}-source`);
		await page.getByRole('textbox', { name: 'Input Type' }).fill('image');
		await page.getByRole('textbox', { name: 'Output Type' }).fill('zarr');
		await createBtn.click();
		await page
			.getByText(`Task source \\"admin:${randomTaskName1}-source\\" already in use`)
			.waitFor();
	});

	await test.step('args_schema with invalid JSON', async () => {
		await page.getByRole('textbox', { name: 'Source' }).fill(`${randomTaskName2}-source`);

		const fileChooserPromise = page.waitForEvent('filechooser');
		await page.getByText('Upload args schema').click();
		const fileChooser = await fileChooserPromise;
		await fileChooser.setFiles(path.join(__dirname, 'data', 'broken.json'));
		await createBtn.click();
		expect(await page.getByText("File doesn't contain valid JSON").count()).toEqual(1);
		await page.getByRole('button', { name: 'Clear' }).click();
	});

	await test.step('args_schema with invalid schema', async () => {
		const fileChooserPromise = page.waitForEvent('filechooser');
		await page.getByText('Upload args schema').click();
		const fileChooser = await fileChooserPromise;
		await fileChooser.setFiles(path.join(__dirname, 'data', 'invalid-schema.json'));
		await createBtn.click();
		expect(
			await page
				.getByText('File doesn\'t contain valid JSON Schema: strict mode: unknown keyword: "foo"')
				.count()
		).toEqual(1);
		await page.getByRole('button', { name: 'Clear' }).click();
	});

	await test.step('valid args_schema', async () => {
		const fileChooserPromise = page.waitForEvent('filechooser');
		await page.getByText('Upload args schema').click();
		const fileChooser = await fileChooserPromise;
		await fileChooser.setFiles(path.join(__dirname, 'data', 'create-ome-zarr-schema.json'));
		await createBtn.click();
		await page.getByText('Task created successfully').waitFor();

		const task = await getCreatedTaskModalData(page, randomTaskName2);
		expect(task.name).toEqual(randomTaskName2);
		expect(task.command).toEqual('/tmp/test');
		expect(task.source).toEqual(`admin:${randomTaskName2}-source`);
		expect(task.input_type).toEqual('image');
		expect(task.output_type).toEqual('zarr');
		expect(task.args_schema).not.toEqual('-');
		expect(task.args_schema_version).toEqual('pydantic_v1');
		expect(task.docs_info).toEqual('-');
		expect(task.docs_link).toEqual('-');
	});

	const randomTaskName3 = Math.random().toString(36).substring(7);

	await test.step('meta file with invalid JSON', async () => {
		await page.getByRole('textbox', { name: 'Task name' }).fill(randomTaskName3);
		await page.getByRole('textbox', { name: 'Command' }).fill('/tmp/test');
		await page.getByRole('textbox', { name: 'Source' }).fill(`${randomTaskName3}-source`);
		await page.getByRole('textbox', { name: 'Input Type' }).fill('image');
		await page.getByRole('textbox', { name: 'Output Type' }).fill('zarr');

		const fileChooserPromise = page.waitForEvent('filechooser');
		await page.getByText('Upload a meta file').click();
		const fileChooser = await fileChooserPromise;
		await fileChooser.setFiles(path.join(__dirname, 'data', 'broken.json'));
		await createBtn.click();
		expect(await page.getByText("File doesn't contain valid JSON").count()).toEqual(1);
		await page.getByRole('button', { name: 'Clear' }).click();
	});

	await test.step('valid meta file', async () => {
		const fileChooserPromise = page.waitForEvent('filechooser');
		await page.getByText('Upload a meta file').click();
		const fileChooser = await fileChooserPromise;
		await fileChooser.setFiles(path.join(__dirname, 'data', 'meta.json'));

		await createBtn.click();
		await page.getByText('Task created successfully').waitFor();

		const task = await getCreatedTaskModalData(page, randomTaskName3);
		expect(task.name).toEqual(randomTaskName3);
		expect(task.command).toEqual('/tmp/test');
		expect(task.source).toEqual(`admin:${randomTaskName3}-source`);
		expect(task.input_type).toEqual('image');
		expect(task.output_type).toEqual('zarr');
		expect(task.args_schema).toEqual('-');
		expect(task.args_schema_version).toEqual('-');
		expect(task.docs_info).toEqual('-');
		expect(task.docs_link).toEqual('-');
	});

	const randomTaskName4 = Math.random().toString(36).substring(7);

	await test.step('fill docs parameters', async () => {
		await page.getByRole('textbox', { name: 'Task name' }).fill(randomTaskName4);
		await page.getByRole('textbox', { name: 'Command' }).fill('/tmp/test');
		await page.getByRole('textbox', { name: 'Source' }).fill(`${randomTaskName4}-source`);
		await page.getByRole('textbox', { name: 'Input Type' }).fill('image');
		await page.getByRole('textbox', { name: 'Output Type' }).fill('zarr');

		await page.getByText('Documentation').click();
		await page.getByRole('textbox', { name: 'Docs info' }).fill('# Task title');
		await page.getByRole('textbox', { name: 'Docs link' }).fill('https://www.example.com');

		await createBtn.click();
		await page.getByText('Task created successfully').waitFor();

		const task = await getCreatedTaskModalData(page, randomTaskName4);
		expect(task.name).toEqual(randomTaskName4);
		expect(task.command).toEqual('/tmp/test');
		expect(task.source).toEqual(`admin:${randomTaskName4}-source`);
		expect(task.input_type).toEqual('image');
		expect(task.output_type).toEqual('zarr');
		expect(task.args_schema).toEqual('-');
		expect(task.args_schema_version).toEqual('-');
		expect(task.docs_info).toEqual('Task title');
		expect(task.docs_link).toEqual('https://www.example.com');
	});
});

/**
 * @param {import('@playwright/test').Page} page
 * @param {string} taskName
 */
async function getCreatedTaskModalData(page, taskName) {
	const row = await getCreatedTaskRow(page, taskName);
	await row.getByRole('button', { name: 'Info' }).click();
	const modalTitle = page.locator('.modal.show .modal-title');
	await modalTitle.waitFor();
	await expect(modalTitle).toHaveText(`Task ${taskName}`);
	const items = await page.locator('.modal.show .modal-body').getByRole('listitem').all();
	const task = {
		name: await items[1].innerText(),
		version: await items[3].innerText(),
		owner: await items[5].innerText(),
		command: await items[7].innerText(),
		source: await items[9].innerText(),
		input_type: await items[11].innerText(),
		output_type: await items[13].innerText(),
		args_schema_version: await items[15].innerText(),
		args_schema: await items[17].innerText(),
		docs_link: await items[19].innerText(),
		docs_info: await items[21].innerText()
	};
	const closeModalBtn = page.locator('.modal.show').getByRole('button', { name: 'Close' }).first();
	await closeModalBtn.click();
	return task;
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
