import { expect, test } from './workflow_fixture.js';
import { waitPageLoading } from '../utils/utils.js';
import { createFakeTask, deleteTask } from '../utils/v2/task.js';

test('Task version update [v2]', async ({ page, workflow }) => {
	await page.goto(workflow.url);
	await waitPageLoading(page);

	test.slow();

	let task;

	await test.step('Create test tasks', async () => {
		task = await createFakeTask(page, {
			type: 'compound',
			version: '0.0.1',
			args_schema_parallel: {
				properties: {
					p1: { type: 'string', default: 'p1' }
				},
				type: 'object'
			},
			args_schema_non_parallel: {
				properties: {
					np1: { type: 'string', default: 'np1' }
				},
				type: 'object'
			}
		});
		await createFakeTask(page, {
			name: task,
			type: 'compound',
			version: '0.0.2',
			args_schema_parallel: {
				properties: {
					p1: { type: 'string', default: 'P1' },
					p2: { type: 'string', default: 'P2' }
				},
				type: 'object'
			},
			args_schema_non_parallel: {
				properties: {
					np1: { type: 'string', default: 'NP1' },
					np2: { type: 'string', default: 'NP2' }
				},
				type: 'object'
			}
		});
	});

	await test.step('Open workflow page', async () => {
		await workflow.openWorkflowPage();
	});

	await test.step('Add tasks v1', async () => {
		await workflow.addTask(task, '0.0.1');
		await workflow.selectTask(task);

		await expect(page.getByRole('textbox', { name: 'p1', exact: true })).toHaveValue('p1');
		await expect(page.getByRole('textbox', { name: 'np1' })).toHaveValue('np1');
	});

	await test.step('Update task to v2', async () => {
		await page.getByRole('button', { name: 'Version' }).click();
		await page
			.getByRole('combobox', { name: /New versions of this task exist/ })
			.selectOption('0.0.2');
		await page.getByRole('button', { name: 'Update' }).click();
		await expect(page.getByText('No new versions available')).toBeVisible();
	});

	await test.step('Check the arguments', async () => {
		await page.getByRole('button', { name: 'Arguments', exact: true }).click();
		await expect(page.getByRole('textbox', { name: 'p1', exact: true })).toHaveValue('p1');
		await expect(page.getByRole('textbox', { name: 'p2', exact: true })).toHaveValue('P2');
		await expect(page.getByRole('textbox', { name: 'np1' })).toHaveValue('np1');
		await expect(page.getByRole('textbox', { name: 'np2' })).toHaveValue('NP2');
	});

	await test.step('Cleanup test tasks', async () => {
		await workflow.delete();
		await deleteTask(page, task, '0.0.2');
		await deleteTask(page, task, '0.0.1');
	});
});
