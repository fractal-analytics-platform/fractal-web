import { uploadFile, waitModalClosed, waitPageLoading } from '../utils';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';
import { expect } from '@playwright/test';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * @param {import('@playwright/test').Page} page
 * @param {Partial<import('fractal-components/types/api').TaskV2 & { version: string | null }>} task
 * @returns {Promise<string>} the name of the created task
 */
export async function createFakeTask(page, task) {
	const taskName = task.name ? task.name : Math.random().toString(36).substring(7);

	const tmpFiles = [];

	try {
		await page.goto('/v2/tasks/management');
		await waitPageLoading(page);
		await page.getByText('Single task').click();

		if (task.type === 'parallel') {
			await page.getByText('Parallel', { exact: true }).click();
		} else if (task.type === 'compound') {
			await page.getByText('Compound', { exact: true }).click();
		}

		await page.getByRole('textbox', { name: 'Task name' }).fill(taskName);

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
 * @param {'v1'|'v2'} version
 */
export async function deleteTask(page, taskName, version = 'v2') {
	if (!page.url().endsWith(`/${version}/tasks/management`)) {
		await page.goto(`/${version}/tasks/management`);
		await waitPageLoading(page);
	}
	let row;
	if (version === 'v1') {
		row = await getTaskRow(page, taskName);
	} else {
		row = await getTaskGroupRow(page, taskName);
	}
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
	const row = page.getByRole('table').last().getByRole('row', { name: taskName });
	await row.waitFor();
	return row;
}

/**
 * @param {import('@playwright/test').Page} page
 * @param {string} taskName
 * @returns {Promise<import('@playwright/test').Locator>}
 */
async function getTaskGroupRow(page, taskName) {
	await collapseExpandedRows(page);
	const row = page.getByRole('table').last().getByRole('row', { name: taskName });
	await expect(row).toBeVisible();
	return row;
}

/**
 * @param {import('@playwright/test').Page} page
 */
export async function collapseExpandedRows(page) {
	const table = page.getByRole('table').last();
	const totalRows = await table.getByRole('row').count();
	const collapseButton = page.getByRole('button', { name: 'Collapse tasks' });
	if (await collapseButton.isVisible()) {
		await collapseButton.click();
		await expect(table.getByRole('row')).toHaveCount(totalRows - 1);
	}
}
