import { expect, test } from './workflow_fixture.js';
import { waitModalClosed, waitPageLoading } from '../utils.js';
import { createDataset } from './dataset_utils.js';
import { waitTasksSuccess } from './workflow_task_utils.js';
import { createFakeTask, deleteTask } from './task_utils.js';

test('Workflow task runs display different versions of arguments schema', async ({
	page,
	workflow
}) => {
	await page.waitForURL(workflow.url);
	await waitPageLoading(page);

	test.slow();

	const modal = page.locator('.modal.show');

	await test.step('Create test dataset', async () => {
		await createDataset(page, workflow.projectId);
	});

	/** @type {string} */
	let taskName;

	await test.step('Create test tasks', async () => {
		taskName = await createFakeTask(page, {
			type: 'non_parallel',
			version: '0.0.1',
			command_non_parallel: 'echo',
			args_schema_non_parallel: {
				properties: {
					p1: { type: 'string' }
				},
				type: 'object'
			}
		});
		await createFakeTask(page, {
			name: taskName,
			type: 'non_parallel',
			version: '0.0.2',
			command_non_parallel: 'echo',
			args_schema_non_parallel: {
				properties: {
					p2: { type: 'number' }
				},
				type: 'object'
			}
		});
	});

	await test.step('Prepare workflow', async () => {
		await page.goto(workflow.url);
		await waitPageLoading(page);
		await workflow.addTask(taskName, '0.0.1');
		await workflow.selectTask(taskName);
		await page.getByRole('textbox', { name: 'p1' }).fill('foo');
		await page.getByRole('button', { name: 'Save changes' }).click();
		await expect(page.getByText('Arguments changes saved successfully')).toBeVisible();
	});

	await test.step('Run workflow', async () => {
		await page.getByRole('button', { name: 'Run workflow' }).click();
		await modal.waitFor();
		await modal.getByRole('button', { name: 'Run' }).click();
		await modal.getByRole('button', { name: 'Confirm' }).click();
		await waitModalClosed(page);
		await waitTasksSuccess(page);
	});

	await test.step('Upgrade task to v0.0.2', async () => {
		await page.getByRole('button', { name: 'Version' }).click();
		await page
			.getByRole('combobox', { name: /New versions of this task exist/ })
			.selectOption('0.0.2');
		await expect(page.getByText('The arguments are valid')).toBeVisible();
		await page.getByRole('button', { name: 'Update' }).click();
		await expect(page.getByText('No new versions available')).toBeVisible();
	});

	await test.step('Update task arguments', async () => {
		await page.getByRole('button', { name: 'Arguments' }).click();
		await page.getByRole('spinbutton', { name: 'p2' }).fill('42');
		await page.getByRole('button', { name: 'Save changes' }).click();
		await expect(page.getByText('Arguments changes saved successfully')).toBeVisible();
	});

	await test.step('Run workflow again', async () => {
		await page.getByRole('button', { name: 'Continue workflow' }).click();
		await modal.waitFor();
		await modal.getByRole('combobox', { name: 'Start workflow at' }).selectOption(taskName);
		await modal.getByRole('button', { name: 'Run', exact: true }).click();
		await modal.getByRole('button', { name: 'Confirm' }).click();
		await waitModalClosed(page);
		await waitTasksSuccess(page);
	});

	await test.step('Check runs', async () => {
		await page.getByLabel('Show runs').click();
		await page.getByRole('button', { name: 'Run 1' }).click();
		await expect(page.getByRole('textbox')).toHaveValue('foo');
		await expect(page.getByRole('textbox')).toBeDisabled();
		await page.getByRole('button', { name: 'Run 2' }).click();
		await expect(page.getByRole('spinbutton')).toHaveValue('42');
		await expect(page.getByRole('spinbutton')).toBeDisabled();
	});

	await test.step('Delete older task version', async () => {
		await page.goto('/v2/tasks/management');
		const taskRow = page.getByRole('row', { name: taskName });
		await taskRow.getByRole('combobox').selectOption('0.0.1');
		await taskRow.getByRole('button', { name: 'Delete' }).click();
		await modal.waitFor();
		await modal.getByRole('button', { name: 'Confirm' }).click();
		await waitModalClosed(page);
	});

	await test.step('Check runs again', async () => {
		await page.goto(workflow.url);
		await waitPageLoading(page);
		await page.getByLabel('Show runs').click();
		await page.getByRole('button', { name: 'Run 1' }).click();
		await expect(page.getByPlaceholder('Argument name')).toHaveValue('p1');
		await expect(page.getByPlaceholder('Argument value')).toHaveValue('foo');
		await expect(page.getByPlaceholder('Argument name')).toBeDisabled();
		await expect(page.getByPlaceholder('Argument value')).toBeDisabled();
		await expect(page.getByRole('button', { name: 'Add property' })).toBeDisabled();
		await page.getByRole('button', { name: 'Run 2' }).click();
		await expect(page.getByRole('spinbutton')).toHaveValue('42');
		await expect(page.getByRole('spinbutton')).toBeDisabled();
	});

	await test.step('Cleanup', async () => {
		await workflow.removeCurrentTask();
		await deleteTask(page, taskName);
	});
});
