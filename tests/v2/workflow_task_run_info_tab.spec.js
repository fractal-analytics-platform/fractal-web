import { expect, test } from './workflow_fixture.js';
import { waitModal, waitModalClosed, waitPageLoading } from '../utils.js';
import { createFakeTask, deleteTask } from './task_utils.js';
import { waitTaskFailure } from './workflow_task_utils.js';
import { createDataset } from './dataset_utils.js';

test('Workflow task info tab show run data', async ({ page, workflow }) => {
	await page.waitForURL(workflow.url);
	await waitPageLoading(page);

	test.slow();

	await test.step('Create test dataset', async () => {
		await createDataset(page, workflow.projectId);
	});

	let taskName;
	await test.step('Create test tasks', async () => {
		taskName = await createFakeTask(page, {
			type: 'non_parallel',
			version: '0.0.1',
			command_non_parallel: 'command1',
			args_schema_non_parallel: {
				properties: {
					property1: { type: 'string' },
				},
				type: 'object'
			}
		});
		await createFakeTask(page, {
			type: 'non_parallel',
			version: '0.0.2',
			name: taskName,
			command_non_parallel: 'command2',
			args_schema_non_parallel: {
				properties: {
					property2: { type: 'string' },
				},
				type: 'object'
			}
		});
	});

	await test.step('Add task v1', async () => {
		await workflow.openWorkflowPage();
		await workflow.addTask(taskName, '0.0.1');
		await workflow.selectTask(taskName);
	});

	await test.step('Set alias and description', async () => {
		await page.getByRole('button', { name: 'Info', exact: true }).click();

		await page.getByRole('button', { name: 'Edit workflow task alias' }).click()
		await page.getByRole('textbox', { name: 'Workflow task alias' }).fill('alias1');
		await page.getByRole('button', { name: 'Save', exact: true }).click();
		await expect(page.getByRole('button', { name: 'Edit workflow task alias' })).not.toBeVisible();

		await page.getByRole('button', { name: 'Edit workflow task description' }).click()
		await page.getByRole('textbox', { name: 'Workflow task description' }).fill('description1');
		await page.getByRole('button', { name: 'Save', exact: true }).click();
		await expect(page.getByRole('button', { name: 'Edit workflow task description' })).not.toBeVisible();
	});

	await test.step('Run workflow', async () => {
		await page.getByRole('button', { name: 'Run workflow' }).click();
		const modal = await waitModal(page);
		await modal.getByRole('button', { name: 'Run', exact: true }).click();
		await modal.getByRole('button', { name: 'Confirm' }).click();
		await waitModalClosed(page);
		await waitTaskFailure(page);
	});

	await test.step('Update task to v2', async () => {
		await page.getByRole('button', { name: 'Version' }).click();
		await page
			.getByRole('combobox', { name: /New versions of this task exist/ })
			.selectOption('0.0.2');
		await page.getByRole('button', { name: 'Update' }).click();
		await expect(page.getByText('No new versions available')).toBeVisible();
	});

	await test.step('Update alias and description', async () => {
		await page.getByRole('button', { name: 'Info', exact: true }).click();

		await page.getByRole('button', { name: 'Edit workflow task alias' }).click()
		await page.getByRole('textbox', { name: 'Workflow task alias' }).fill('alias2');
		await page.getByRole('button', { name: 'Save', exact: true }).click();
		await expect(page.getByRole('button', { name: 'Edit workflow task alias' })).not.toBeVisible();

		await page.getByRole('button', { name: 'Edit workflow task description' }).click()
		await page.getByRole('textbox', { name: 'Workflow task description' }).fill('description2');
		await page.getByRole('button', { name: 'Save', exact: true }).click();
		await expect(page.getByRole('button', { name: 'Edit workflow task description' })).not.toBeVisible();
	});

	await test.step('Run workflow again', async () => {
		await page.getByRole('button', { name: 'Continue workflow' }).click();
		const modal = await waitModal(page);
		await modal.getByRole('button', { name: 'Run', exact: true }).click();
		await modal.getByRole('button', { name: 'Confirm' }).click();
		await waitModalClosed(page);
		await waitTaskFailure(page);
	});

	await test.step('Check run values in Info tab', async () => {
		await page.getByRole('button', { name: 'Info', exact: true }).click();
		await page.getByRole('button', { name: 'Advanced Info' }).click();
		await page.getByRole('button', { name: 'Show runs', exact: true }).click();

		const v1Values = ['0.0.1', 'alias1', 'description1', 'command1'];
		const v2Values = ['0.0.2', 'alias2', 'description2', 'command2'];

		await expectInfoTexts(page, v1Values, false);
		await expectInfoTexts(page, v2Values, true);
		await expect(page.locator('#info-tab').getByText('property2')).toBeVisible();
		await expect(page.getByRole('button', { name: 'Edit workflow task alias' })).toBeVisible();
		await expect(page.getByRole('button', { name: 'Edit workflow task description' })).toBeVisible();

		await page.getByRole('button', { name: 'Run 1' }).click();

		await expectInfoTexts(page, v1Values, true);
		await expectInfoTexts(page, v2Values, false);
		await expect(page.locator('#info-tab').getByText('property2')).toBeVisible();
		await expect(page.getByRole('button', { name: 'Edit workflow task alias' })).not.toBeVisible();
		await expect(page.getByRole('button', { name: 'Edit workflow task description' })).not.toBeVisible();

		await page.getByRole('button', { name: 'Run 2' }).click();

		await expectInfoTexts(page, v1Values, false);
		await expectInfoTexts(page, v2Values, true);
		await expect(page.locator('#info-tab').getByText('property2')).toBeVisible();
		await expect(page.getByRole('button', { name: 'Edit workflow task alias' })).not.toBeVisible();
		await expect(page.getByRole('button', { name: 'Edit workflow task description' })).not.toBeVisible();
	});

	/**
	 * @param {import('@playwright/test').Page} page 
	 * @param {string[]} values 
	 * @param {boolean} visible 
	 */
	async function expectInfoTexts(page, values, visible) {
		for (const value of values) {
			const locator = page.locator('#info-tab').getByText(value);
			if (visible) {
				await expect(locator).toBeVisible();
			} else {
				await expect(locator).not.toBeVisible();
			}
		}
	}

	await test.step('Cleanup test tasks', async () => {
		await workflow.removeCurrentTask();
		await deleteTask(page, taskName); // 0.0.2
		await deleteTask(page, taskName); // 0.0.1
	});
});
