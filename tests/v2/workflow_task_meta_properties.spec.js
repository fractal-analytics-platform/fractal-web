import { test } from './workflow_fixture.js';
import { waitPageLoading } from '../utils.js';
import { createFakeTask, deleteTask } from './task_utils.js';

test('Workflow task meta properties [v2]', async ({ page, workflow }) => {
	await page.waitForURL(workflow.url);
	await waitPageLoading(page);

	let taskName;
	await test.step('Create test tasks', async () => {
		taskName = await createFakeTask(page, { type: 'non_parallel' });
	});

	await test.step('Open workflow page', async () => {
		await workflow.openWorkflowPage();
	});

	await test.step('Add tasks to workflow', async () => {
		await workflow.addUserTask(taskName);
		await workflow.selectTask(taskName);
	});

	await test.step('Open Meta tab', async () => {
		await page.getByText('Meta', { exact: true }).click();
	});

	await test.step('Add first property', async () => {
		await page.getByRole('button', { name: 'Add property' }).click();
		await page.getByPlaceholder('Arg name').fill('arg-k1');
		await page.getByPlaceholder('Argument default value').fill('arg-v1');
		await page.getByLabel('Save argument').click();
	});

	await test.step('Add second property', async () => {
		await page.getByRole('button', { name: 'Add property' }).click();
		await page.getByPlaceholder('Arg name').fill('arg-k2');
		await page.getByPlaceholder('Argument default value').fill('arg-v2');
		await page.getByLabel('Save argument').click();
	});

	await test.step('Verify that meta contains the 2 properties', async () => {
		await page.getByText('arg-k1').waitFor();
		await page.getByText('arg-k2').waitFor();
		await page.getByText('arg-v1').waitFor();
		await page.getByText('arg-v2').waitFor();
	});

	await test.step('Cleanup', async () => {
		await workflow.removeCurrentTask();
		await deleteTask(page, taskName);
	});
});
