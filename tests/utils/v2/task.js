import path from 'path';
import { checkApiError, getFractalCookie, getRandomName } from '../utils';
import { expect } from '@playwright/test';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * @param {import('@playwright/test').Page} page
 * @param {Partial<import('fractal-components/types/api').TaskV2 & { version: string | null }>} task
 * @returns {Promise<string>} the name of the created task
 */
export async function createFakeTask(page, task) {
	const name = task.name ?? getRandomName();
	const data = {
		input_types: {},
		output_types: {},
		args_schema_version: 'pydantic_v2',
		...task,
		name
	};

	const command = path.join(__dirname, '..', '..', 'data', 'fake-task.sh');

	if (
		task.type === 'non_parallel' ||
		task.type === 'compound' ||
		task.type === 'converter_non_parallel'
	) {
		data.command_non_parallel = task.command_non_parallel || command;
	}
	if (task.type === 'parallel' || task.type === 'compound' || task.type === 'converter_compound') {
		data.command_parallel = task.command_parallel || command;
	}

	const response = await page.request.post(`/api/v2/task?private=false&user_group_id=1`, {
		headers: { Cookie: await getFractalCookie(page) },
		data
	});
	await checkApiError(response, 'Unable to create task');
	return name;
}

/**
 * @param {import('@playwright/test').Page} page
 * @param {string} taskName
 * @param {string|undefined} version
 */
export async function deleteTask(page, taskName, version = undefined) {
	const { id } = await getTaskGroupByName(page, taskName, version);
	const response = await page.request.post(`/api/v2/task-group/${id}/delete`, {
		headers: { Cookie: await getFractalCookie(page) }
	});
	await checkApiError(response, 'Unable to delete task group');
}

/**
 * @param {import('@playwright/test').Page} page
 * @param {string} taskName
 * @param {string|undefined} version
 * @returns {Promise<{id: number}>}
 */
async function getTaskGroupByName(page, taskName, version = undefined) {
	const response = await page.request.get(`/api/v2/task-group?slim=true`, {
		headers: { Cookie: await getFractalCookie(page) }
	});
	await checkApiError(response, 'Unable to retrieve task groups');
	const taskGroups = await response.json();
	const t = taskGroups.find(([n]) => n === taskName);
	if (!t) {
		throw new Error(`Unable to find task group "${taskName}"`);
	}
	if (version) {
		const tv = t[1].find((t) => t.version === version);
		if (!tv) {
			throw new Error(`Unable to find task group with version "${version}"`);
		}
		return tv;
	}
	return t[1][0];
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

/**
 * @param {import('@playwright/test').Page} page
 * @param {string[]} expectedNames
 */
export async function checkTasksOrder(page, ...expectedNames) {
	const tasksListContainer = page.getByTestId('workflow-tasks-list');
	await expect(tasksListContainer.getByRole('button')).toHaveCount(expectedNames.length);
	const names = await tasksListContainer.getByRole('button').allInnerTexts();
	expect(names.length).toEqual(expectedNames.length);
	for (let i = 0; i < expectedNames.length; i++) {
		expect(names[i]).toEqual(expectedNames[i]);
	}
}
