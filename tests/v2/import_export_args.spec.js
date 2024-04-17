import { expect, test } from './workflow_fixture.js';
import { waitModalClosed, waitPageLoading } from '../utils.js';
import { createFakeTask, deleteTask } from './task_utils.js';
import path from 'path';
import fs from 'fs';
import os from 'os';

test('Import/export arguments [v2]', async ({ page, workflow }) => {
	await page.waitForURL(workflow.url);
	await waitPageLoading(page);

	let nonParallelTaskWithoutArgsSchema;
	let parallelTaskWithoutArgsSchema;
	let compoundTaskWithoutArgsSchema;
	let nonParallelTaskWithArgsSchema;
	let parallelTaskWithArgsSchema;
	let compoundTaskWithArgsSchema;

	await test.step('Create test tasks', async () => {
		nonParallelTaskWithoutArgsSchema = await createFakeTask(page, { type: 'non_parallel' });
		parallelTaskWithoutArgsSchema = await createFakeTask(page, { type: 'parallel' });
		compoundTaskWithoutArgsSchema = await createFakeTask(page, { type: 'compound' });
		nonParallelTaskWithArgsSchema = await createFakeTask(page, {
			type: 'non_parallel',
			args_schema_non_parallel: {
				properties: {
					test_non_parallel: {
						type: 'string',
						title: 'test_non_parallel'
					}
				},
				type: 'object'
			}
		});
		parallelTaskWithArgsSchema = await createFakeTask(page, {
			type: 'parallel',
			args_schema_parallel: {
				properties: {
					test_parallel: {
						type: 'string',
						title: 'test_parallel'
					}
				},
				type: 'object'
			}
		});
		compoundTaskWithArgsSchema = await createFakeTask(page, {
			type: 'compound',
			args_schema_non_parallel: {
				properties: {
					test_non_parallel: {
						type: 'string',
						title: 'test_non_parallel'
					}
				},
				type: 'object'
			},
			args_schema_parallel: {
				properties: {
					test_parallel: {
						type: 'string',
						title: 'test_parallel'
					}
				},
				type: 'object'
			}
		});
	});

	await test.step('Open workflow page', async () => {
		await workflow.openWorkflowPage();
	});

	await test.step('Non parallel task without args schema', async () => {
		await workflow.addUserTask(nonParallelTaskWithoutArgsSchema);
		await workflow.selectTask(nonParallelTaskWithoutArgsSchema);
		await page.getByRole('button', { name: 'Add property' }).click();
		await page.getByPlaceholder('Arg name').click();
		await page.getByPlaceholder('Arg name').fill('key_non_parallel');
		await page.getByPlaceholder('Argument default value').fill('value_non_parallel');
		await page.getByLabel('Save argument').click();

		const { file, data } = await exportArgs(page, nonParallelTaskWithoutArgsSchema);
		expect(data.args_non_parallel.key_non_parallel).toEqual('value_non_parallel');
		expect(data.args_parallel).toEqual(null);
		const newData = { args_non_parallel: { key_non_parallel: 'value_non_parallel-updated' } };
		await importArgs(page, file, newData);
		await page.getByText('value_non_parallel-updated').waitFor();
		await workflow.removeCurrentTask();
	});

	await test.step('Parallel task without args schema', async () => {
		await workflow.addUserTask(parallelTaskWithoutArgsSchema);
		await workflow.selectTask(parallelTaskWithoutArgsSchema);
		await page.getByRole('button', { name: 'Add property' }).click();
		await page.getByPlaceholder('Arg name').click();
		await page.getByPlaceholder('Arg name').fill('key_parallel');
		await page.getByPlaceholder('Argument default value').fill('value_parallel');
		await page.getByLabel('Save argument').click();

		const { file, data } = await exportArgs(page, parallelTaskWithoutArgsSchema);
		expect(data.args_non_parallel).toEqual(null);
		expect(data.args_parallel.key_parallel).toEqual('value_parallel');
		const newData = { args_parallel: { key_parallel: 'value_parallel-updated' } };
		await importArgs(page, file, newData);
		await page.getByText('value_parallel-updated').waitFor();
		await workflow.removeCurrentTask();
	});

	await test.step('Compound task without args schema', async () => {
		await workflow.addUserTask(compoundTaskWithoutArgsSchema);
		await workflow.selectTask(compoundTaskWithoutArgsSchema);
		await page.getByRole('button', { name: 'Add property' }).first().click();
		await page.getByPlaceholder('Arg name').fill('key_non_parallel');
		await page.getByPlaceholder('Argument default value').fill('value_non_parallel');
		await page.getByLabel('Save argument').click();
		await page.getByText('Arguments changes saved successfully').waitFor();
		await page.getByRole('button', { name: 'Add property' }).nth(1).click();
		await page.getByPlaceholder('Arg name').fill('key_parallel');
		await page.getByPlaceholder('Argument default value').fill('value_parallel');
		await page.getByLabel('Save argument').click();
		await page.getByText('Arguments changes saved successfully').waitFor();

		const { file, data } = await exportArgs(page, compoundTaskWithoutArgsSchema);
		expect(data.args_non_parallel.key_non_parallel).toEqual('value_non_parallel');
		expect(data.args_parallel.key_parallel).toEqual('value_parallel');
		const newData = {
			args_non_parallel: { key_non_parallel: 'value_non_parallel-updated' },
			args_parallel: { key_parallel: 'value_parallel-updated' }
		};
		await importArgs(page, file, newData);
		await page.getByText('value_non_parallel-updated').waitFor();
		await page.getByText('value_parallel-updated').waitFor();
		await workflow.removeCurrentTask();
	});

	await test.step('Non parallel task with args schema', async () => {
		await workflow.addUserTask(nonParallelTaskWithArgsSchema);
		await workflow.selectTask(nonParallelTaskWithArgsSchema);
		await page.getByRole('textbox', { name: 'test_non_parallel' }).fill('value_non_parallel');
		await page.getByRole('button', { name: 'Save changes' }).click();
		const { file, data } = await exportArgs(page, nonParallelTaskWithoutArgsSchema);
		expect(data.args_non_parallel.test_non_parallel).toEqual('value_non_parallel');
		expect(data.args_parallel).toEqual(null);
		const newData = { args_non_parallel: { test_non_parallel: 'value_non_parallel-updated' } };
		await importArgs(page, file, newData);
		expect(await page.getByRole('textbox', { name: 'test_non_parallel' }).inputValue()).toEqual(
			'value_non_parallel-updated'
		);
		await workflow.removeCurrentTask();
	});

	await test.step('Parallel task with args schema', async () => {
		await workflow.addUserTask(parallelTaskWithArgsSchema);
		await workflow.selectTask(parallelTaskWithArgsSchema);
		await page.getByRole('textbox', { name: 'test_parallel' }).fill('value_parallel');
		await page.getByRole('button', { name: 'Save changes' }).click();
		const { file, data } = await exportArgs(page, parallelTaskWithArgsSchema);
		expect(data.args_non_parallel).toEqual(null);
		expect(data.args_parallel.test_parallel).toEqual('value_parallel');
		const newData = { args_parallel: { test_parallel: 'value_parallel-updated' } };
		await importArgs(page, file, newData);
		expect(await page.getByRole('textbox', { name: 'test_parallel' }).inputValue()).toEqual(
			'value_parallel-updated'
		);
		await workflow.removeCurrentTask();
	});

	await test.step('Compound task with args schema', async () => {
		await workflow.addUserTask(compoundTaskWithArgsSchema);
		await workflow.selectTask(compoundTaskWithArgsSchema);
		await page.getByRole('textbox', { name: 'test_non_parallel' }).fill('value_non_parallel');
		await page.getByRole('textbox', { name: 'test_parallel' }).fill('value_parallel');
		await page.getByRole('button', { name: 'Save changes' }).click();
		const { file, data } = await exportArgs(page, compoundTaskWithArgsSchema);
		expect(data.args_non_parallel.test_non_parallel).toEqual('value_non_parallel');
		expect(data.args_parallel.test_parallel).toEqual('value_parallel');
		const newData = {
			args_non_parallel: { test_non_parallel: 'value_non_parallel-updated' },
			args_parallel: { test_parallel: 'value_parallel-updated' }
		};
		await importArgs(page, file, newData);
		expect(await page.getByRole('textbox', { name: 'test_non_parallel' }).inputValue()).toEqual(
			'value_non_parallel-updated'
		);
		expect(await page.getByRole('textbox', { name: 'test_parallel' }).inputValue()).toEqual(
			'value_parallel-updated'
		);
		await workflow.removeCurrentTask();
	});

	await test.step('Cleanup test tasks', async () => {
		await deleteTask(page, nonParallelTaskWithoutArgsSchema);
		await deleteTask(page, parallelTaskWithoutArgsSchema);
		await deleteTask(page, compoundTaskWithoutArgsSchema);
		await deleteTask(page, nonParallelTaskWithArgsSchema);
		await deleteTask(page, parallelTaskWithArgsSchema);
		await deleteTask(page, compoundTaskWithArgsSchema);
	});
});

/**
 * @param {import('@playwright/test').Page} page
 * @param {string} taskName
 * @returns {Promise<{file: string, data: object}>} file is downloaded file path and data is its parsed content
 */
async function exportArgs(page, taskName) {
	const downloadPromise = page.waitForEvent('download');
	await page.getByRole('button', { name: 'Export' }).click();
	const download = await downloadPromise;
	const file = path.join(os.tmpdir(), `${taskName}-args-${download.suggestedFilename()}`);
	await download.saveAs(file);
	const data = JSON.parse(fs.readFileSync(file).toString());
	return {
		file,
		data
	};
}

/**
 * @param {import('@playwright/test').Page} page
 * @param {string} file
 * @param {object} data
 */
async function importArgs(page, file, data) {
	fs.writeFileSync(file, JSON.stringify(data));
	await page.getByRole('button', { name: 'Import' }).click();
	const modalTitle = page.locator('.modal.show .modal-title');
	await modalTitle.waitFor();
	const fileChooserPromise = page.waitForEvent('filechooser');
	await page.getByText('Select arguments file').click();
	const fileChooser = await fileChooserPromise;
	await fileChooser.setFiles(file);
	await page.getByRole('button', { name: 'Confirm' }).click();
	await waitModalClosed(page);
	fs.rmSync(file);
}
