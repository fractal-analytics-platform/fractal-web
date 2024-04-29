import { expect, test } from './workflow_fixture.js';
import { waitPageLoading } from '../utils.js';
import { createFakeTask, deleteTask } from './task_utils.js';

test('Task version update [v2]', async ({ page, workflow }) => {
	await page.waitForURL(workflow.url);
	await waitPageLoading(page);

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
					p2: { type: 'string' }
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
					p2: { type: 'string' }
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

	await test.step('Add non parallel task v1', async () => {
		await workflow.addUserTask(nonParallelTask, 'v0.0.1');
		await workflow.selectTask(nonParallelTask);
	});

	await test.step('Fill optional argument p2', async () => {
		await page.getByRole('textbox', { name: 'p2' }).fill('foo');
		await page.getByRole('button', { name: 'Save changes' }).click();
		await page.getByText('Arguments changes saved successfully').waitFor();
	});

	await test.step('Update non parallel task to v2', async () => {
		await page.getByRole('button', { name: 'Version' }).click();
		await page
			.getByRole('combobox', { name: 'New versions of this task exist:' })
			.selectOption('0.0.2');
		await page.getByText('Following errors must be fixed before performing the update').waitFor();
		await expect(page.locator('.alert-danger li')).toHaveCount(1);
		await page
			.getByRole('textbox', { name: 'Fix the non parallel arguments:' })
			.fill('{"p1": "test"}');
		await page.getByRole('button', { name: 'Check' }).click();
		await page.getByText('The arguments are valid').waitFor();
		await page.getByRole('button', { name: 'Update' }).click();
		await page.getByText('No new versions available').waitFor();
		await workflow.removeCurrentTask();
	});

	await test.step('Add parallel task v1', async () => {
		await workflow.addUserTask(parallelTask, 'v0.0.1');
		await workflow.selectTask(parallelTask);
	});

	await test.step('Update parallel task to v2', async () => {
		await page.getByRole('button', { name: 'Version' }).click();
		await page
			.getByRole('combobox', { name: 'New versions of this task exist:' })
			.selectOption('0.0.2');
		await page.getByText('Following errors must be fixed before performing the update').waitFor();
		await page.getByRole('textbox', { name: 'Fix the parallel arguments:' }).fill('{"p2": "test"}');
		await page.getByRole('button', { name: 'Check' }).click();
		await page.getByText('The arguments are valid').waitFor();
		await page.getByRole('button', { name: 'Update' }).click();
		await page.getByText('No new versions available').waitFor();
		await workflow.removeCurrentTask();
	});

	await test.step('Add compound task v1', async () => {
		await workflow.addUserTask(compoundTask, 'v0.0.1');
		await workflow.selectTask(compoundTask);
	});

	await test.step('Update compound task to v2', async () => {
		await page.getByRole('button', { name: 'Version' }).click();
		await page
			.getByRole('combobox', { name: 'New versions of this task exist:' })
			.selectOption('0.0.2');
		await page
			.getByText('Following errors must be fixed before performing the update')
			.first()
			.waitFor();
		await page.getByRole('textbox', { name: 'Fix the non parallel arguments:' }).click();
		await page
			.getByRole('textbox', { name: 'Fix the non parallel arguments:' })
			.fill('{"p1": "test"}');
		await page.getByRole('textbox', { name: 'Fix the parallel arguments:' }).click();
		await page.getByRole('textbox', { name: 'Fix the parallel arguments:' }).fill('{"p2": "test"}');
		await page.getByRole('button', { name: 'Check' }).click();
		await page.getByText('The arguments are valid').first().waitFor();
		await page.getByRole('button', { name: 'Update' }).click();
		await page.getByText('No new versions available').waitFor();
		await workflow.removeCurrentTask();
	});

	await test.step('Cleanup test tasks', async () => {
		await deleteTask(page, nonParallelTask); // v0.0.1
		await deleteTask(page, nonParallelTask); // v0.0.2
		await deleteTask(page, parallelTask); // v0.0.1
		await deleteTask(page, parallelTask); // v0.0.2
		await deleteTask(page, compoundTask); // v0.0.1
		await deleteTask(page, compoundTask); // v0.0.2
	});
});
