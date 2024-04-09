import { waitModalClosed, waitPageLoading } from '../utils';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';
import os from 'os';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * @param {import('@playwright/test').Page} page
 * @param {Partial<import('$lib/types-v2').TaskV2>} task
 * @returns {Promise<string>} the name of the created task
 */
export async function createFakeTask(page, task) {
	const taskName = task.name ? task.name : Math.random().toString(36).substring(7);

	const tmpFiles = [];

	try {
		await page.goto('/v2/tasks');
		await waitPageLoading(page);
		await page.getByText('Single task').click();

		if (task.type === 'parallel') {
			await page.getByText('Parallel', { exact: true }).click();
		} else if (task.type === 'compound') {
			await page.getByText('Compound', { exact: true }).click();
		}

		await page.getByRole('textbox', { name: 'Task name' }).fill(taskName);

		const randomTaskSource = Math.random().toString(36).substring(7);
		await page.getByRole('textbox', { name: 'Source' }).fill(randomTaskSource);

		const command = path.join(__dirname, '..', 'data', 'fake-task.sh');
		if (task.type === 'non_parallel' || task.type === 'compound') {
			await page.getByRole('textbox', { name: 'Command non parallel' }).fill(command);
		}
		if (task.type === 'parallel' || task.type === 'compound') {
			await page.getByRole('textbox', { name: 'Command parallel' }).fill(command);
		}

		if (task.version) {
			await page.getByRole('textbox', { name: 'Version' }).fill(task.version);
		}

		if (task.args_schema_non_parallel) {
			tmpFiles.push(
				await uploadFile(
					page,
					'Upload non parallel args schema',
					`${taskName}-args-non-parallel.json`,
					task.args_schema_non_parallel
				)
			);
		}

		if (task.args_schema_parallel) {
			tmpFiles.push(
				await uploadFile(
					page,
					'Upload parallel args schema',
					`${taskName}-args-parallel.json`,
					task.args_schema_parallel
				)
			);
		}

		const createBtn = page.getByRole('button', { name: /^Create$/ });
		await createBtn.click();
		await page.getByText('Task created successfully').waitFor();
	} finally {
		for (const tmpFile of tmpFiles) {
			fs.rmSync(tmpFile);
		}
	}
	return taskName;
}

/**
 * @param {import('@playwright/test').Page} page
 * @param {string} taskName
 */
export async function deleteTask(page, taskName) {
	await page.goto('/v2/tasks');
	await waitPageLoading(page);
	const row = await getTaskRow(page, taskName);
	await row.getByRole('button', { name: 'Delete' }).click();
	const modal = page.locator('.modal.show');
	await modal.waitFor();
	await modal.getByRole('button', { name: 'Confirm' }).click();
	await waitModalClosed(page);
}

/**
 * @param {import('@playwright/test').Page} page
 * @param {string} taskName
 * @returns {Promise<import('@playwright/test').Locator>}
 */
async function getTaskRow(page, taskName) {
	const rows = await page.getByRole('table').last().getByRole('row').all();
	for (const row of rows) {
		const rowTaskName = (await row.getByRole('cell').first().innerText()).trim();
		if (rowTaskName === taskName) {
			return row;
		}
	}
	throw new Error(`Unable to find task ${taskName} in tasks table`);
}

/**
 * @param {import('@playwright/test').Page} page
 * @param {string} selectorText
 * @param {string} fileName
 * @param {any} data
 * @returns {Promise<string>} the path of the created file
 */
async function uploadFile(page, selectorText, fileName, data) {
	const file = path.join(os.tmpdir(), fileName);
	fs.writeFileSync(file, JSON.stringify(data));

	const fileChooserPromise = page.waitForEvent('filechooser');
	await page.getByText(selectorText).click();
	const fileChooser = await fileChooserPromise;
	await fileChooser.setFiles(file);

	return file;
}
