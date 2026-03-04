import { expect, test } from './workflow_fixture.js';
import { waitPageLoading } from '../utils.js';
import { createFakeTask, deleteTask } from './task_utils.js';

test('Task version update [v2]', async ({ page, workflow }) => {
	await page.waitForURL(workflow.url);
	await waitPageLoading(page);

	test.slow();

	let nonParallelTask;
	let parallelTask;
	let compoundTask;

	await test.step('Create test tasks', async () => {
		nonParallelTask = await createFakeTask(page, {
			type: 'non_parallel',
			version: '0.0.1',
			args_schema_non_parallel: {
				properties: {
					p1: { type: 'string' },
					// Optional arguments added to test bug #474
					p2: { type: 'string', title: 'p2' },
					p3: { type: 'string', title: 'p3' }
				},
				type: 'object'
			}
		});
		await createFakeTask(page, {
			name: nonParallelTask,
			type: 'non_parallel',
			version: '0.0.2',
			args_schema_non_parallel: {
				properties: {
					p1: { type: 'string' },
					p2: { type: 'string', title: 'p2' },
					p3: { type: 'string', title: 'p3' }
				},
				type: 'object',
				required: ['p1']
			}
		});
		parallelTask = await createFakeTask(page, {
			type: 'parallel',
			version: '0.0.1',
			args_schema_parallel: {
				properties: {
					p2: { type: 'string', title: 'p2' }
				},
				type: 'object'
			}
		});
		await createFakeTask(page, {
			name: parallelTask,
			type: 'parallel',
			version: '0.0.2',
			args_schema_parallel: {
				properties: {
					p2: { type: 'string', title: 'p2' }
				},
				type: 'object',
				required: ['p2']
			}
		});
		await createFakeTask(page, {
			name: parallelTask,
			type: 'parallel',
			version: '0.0.3',
			args_schema_parallel: {
				properties: {
					p2: { type: 'string', title: 'p2' }
				},
				type: 'object',
				required: ['p2']
			}
		});
		// test for type mismatch: from parallel to non_parallel
		await createFakeTask(page, {
			name: parallelTask,
			type: 'non_parallel',
			version: '0.0.4',
			args_schema_non_parallel: {
				properties: {
					p2: { type: 'string', title: 'p2' }
				},
				type: 'object',
				required: ['p2']
			}
		});
		compoundTask = await createFakeTask(page, {
			type: 'compound',
			version: '0.0.1',
			args_schema_non_parallel: {
				properties: {
					p1: { type: 'string' }
				},
				type: 'object'
			},
			args_schema_parallel: {
				properties: {
					p2: { type: 'string' }
				},
				type: 'object'
			}
		});
		await createFakeTask(page, {
			name: compoundTask,
			type: 'compound',
			version: '0.0.2',
			args_schema_non_parallel: {
				properties: {
					p1: { type: 'string' }
				},
				type: 'object',
				required: ['p1']
			},
			args_schema_parallel: {
				properties: {
					p2: { type: 'string' }
				},
				type: 'object',
				required: ['p2']
			}
		});
	});

	await test.step('Open workflow page', async () => {
		await workflow.openWorkflowPage();
	});

	await test.step('Verify that parallelTask 0.0.4 (type mismatch) can be selected', async () => {
		await workflow.addTask(parallelTask, '0.0.4');
		await workflow.selectTask(parallelTask);
		await workflow.removeCurrentTask();
	});

	await test.step('Add tasks and select non parallel v1 task', async () => {
		await workflow.addTask(nonParallelTask, '0.0.1');
		await workflow.addTask(parallelTask, '0.0.1');
		await workflow.addTask(compoundTask, '0.0.1');
		await workflow.selectTask(nonParallelTask);
	});

	await test.step('Fill optional argument p2', async () => {
		await page.getByRole('textbox', { name: 'p2' }).fill('foo');
		await page.getByRole('button', { name: 'Save changes' }).click();
		await expect(page.getByText('Arguments changes saved successfully')).toBeVisible();
	});

	await test.step('Add Input Filters', async () => {
		await page.getByText('Types').click();
		await page.getByRole('button', { name: 'Add type filter', exact: true }).click();
		await page.getByPlaceholder('Key').fill('key2');
		await page.getByRole('button', { name: 'Save' }).click();
		await expect(page.getByText('Input filters successfully updated')).toBeVisible();
	});

	await test.step('Update non parallel task to v2', async () => {
		await page.getByRole('button', { name: 'Version' }).click();
		await page
			.getByRole('combobox', { name: /New versions of this task exist/ })
			.selectOption('0.0.2');
		await expect(page.getByText(/The old arguments are not compatible with the new schema/)).toBeVisible();
		await page.getByRole('button', { name: 'Update' }).click();
		await expect(page.getByText('No new versions available')).toBeVisible();
	});

	await test.step('Fix the arguments', async () => {
		await page.getByRole('button', { name: 'Arguments', exact: true }).click();
		await expect(page.getByText('Data is not valid')).toBeVisible();
		await page.getByRole('textbox', { name: 'p1' }).fill('test');
		await expect(page.getByText('Data is not valid')).not.toBeVisible();
		await page.getByRole('button', { name: 'Save changes' }).click();
		await expect(page.getByText('Arguments changes saved successfully')).toBeVisible();
	});

	await test.step('Verify that input filters have been preserved', async () => {
		await page.getByText('Types').click();
		await expect(page.getByPlaceholder('Key')).toHaveValue('key2');
	});

	await test.step('Verify that task order is preserved', async () => {
		await checkTasksOrder(page, nonParallelTask, parallelTask, compoundTask);
	});

	await test.step('Select parallel task v1', async () => {
		await workflow.selectTask(parallelTask);
	});

	await test.step('Update parallel task to v2', async () => {
		await page.getByRole('button', { name: 'Version' }).click();
		await page
			.getByRole('combobox', { name: /New versions of this task exist/ })
			.selectOption('0.0.2');
		await expect(page.getByText(/The old arguments are not compatible with the new schema/)).toBeVisible();
		await page.getByRole('button', { name: 'Update' }).click();
		await expect(
			page.getByRole('combobox', { name: /New versions of this task exist/ }).getByRole('option')
		).toHaveCount(2);
		await expect(
			page
				.getByRole('combobox', { name: /New versions of this task exist/ })
				.getByRole('option')
				.nth(1)
		).toHaveText('0.0.3');
	});

	await test.step('Update parallel task to v3 (no fix needed)', async () => {
		await expect(page.getByText('Arguments changes saved successfully')).not.toBeVisible();
		await page.getByRole('button', { name: 'Arguments', exact: true }).click();
		await page.getByRole('textbox', { name: 'p2' }).fill('test-value');
		await page.getByRole('button', { name: 'Save changes' }).click();
		await expect(page.getByText('Arguments changes saved successfully')).toBeVisible();
		await expect(page.getByRole('button', { name: 'Save changes' })).toBeDisabled();
		await page.getByRole('button', { name: 'Version' }).click();
		await page
			.getByRole('combobox', { name: /New versions of this task exist/ })
			.selectOption('0.0.3');
		await page.getByRole('button', { name: 'Update' }).click();
		// Task version 0.0.4 is ignored, since it has a different type
		await expect(page.getByText('No new versions available')).toBeVisible();
		// Verify that the arguments are preserved after the update
		await page.getByRole('button', { name: 'Arguments', exact: true }).click();
		await expect(page.getByRole('textbox', { name: 'p2' })).toHaveValue('test-value');
	});

	await test.step('Verify that task order is preserved', async () => {
		await checkTasksOrder(page, nonParallelTask, parallelTask, compoundTask);
	});

	await test.step('Select compound task v1', async () => {
		await workflow.selectTask(compoundTask);
	});

	await test.step('Update compound task to v2', async () => {
		await page.getByRole('button', { name: 'Version' }).click();
		await page
			.getByRole('combobox', { name: /New versions of this task exist/ })
			.selectOption('0.0.2');
		await expect(page.getByText(/The old arguments are not compatible with the new schema/)).toBeVisible();
		await page.getByRole('button', { name: 'Update' }).click();
		await expect(page.getByText('No new versions available')).toBeVisible();
	});

	await test.step('Cleanup test tasks', async () => {
		await workflow.removeCurrentTask();
		await workflow.selectTask(nonParallelTask);
		await workflow.removeCurrentTask();
		await workflow.selectTask(parallelTask);
		await workflow.removeCurrentTask();
		await deleteTask(page, nonParallelTask); // 0.0.2
		await deleteTask(page, nonParallelTask); // 0.0.1
		await deleteTask(page, parallelTask); // 0.0.4
		await deleteTask(page, parallelTask); // 0.0.3
		await deleteTask(page, parallelTask); // 0.0.2
		await deleteTask(page, parallelTask); // 0.0.1
		await deleteTask(page, compoundTask); // 0.0.2
		await deleteTask(page, compoundTask); // 0.0.1
	});
});

/**
 * @param {import('@playwright/test').Page} page
 * @param {string[]} expectedNames
 */
async function checkTasksOrder(page, ...expectedNames) {
	const tasksListContainer = page.getByTestId('workflow-tasks-list');
	const names = await tasksListContainer.getByRole('button').allInnerTexts();
	expect(names.length).toEqual(expectedNames.length);
	for (let i = 0; i < expectedNames.length; i++) {
		expect(names[i]).toEqual(expectedNames[i]);
	}
}
