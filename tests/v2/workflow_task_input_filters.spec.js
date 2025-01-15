import { expect, test } from './workflow_fixture.js';
import { waitModalClosed, waitPageLoading } from '../utils.js';
import { createFakeTask, deleteTask } from './task_utils.js';
import { createDataset } from './dataset_utils.js';

test('Workflow task input filters [v2]', async ({ page, workflow }) => {
	await page.waitForURL(workflow.url);
	await waitPageLoading(page);

	let taskName1, taskName2;
	await test.step('Create test tasks', async () => {
		taskName1 = await createFakeTask(page, { type: 'non_parallel' });
		taskName2 = await createFakeTask(page, { type: 'non_parallel' });
	});

	let datasetId, datasetName;
	await test.step('Create test dataset', async () => {
		const { id, name } = await createDataset(page, workflow.projectId);
		datasetId = id;
		datasetName = name;
	});

	await test.step('Add images to test dataset', async () => {
		await page.goto(`/v2/projects/${workflow.projectId}/datasets/${datasetId}`);
		await waitPageLoading(page);
		await page.getByRole('button', { name: 'Add an image list entry' }).click();
		let modal = page.locator('.modal.show');
		await modal.waitFor();
		await modal
			.getByRole('textbox', { name: 'Zarr URL' })
			.fill(`/tmp/playwright/datasets/${datasetName}/img1`);
		await modal.getByRole('button', { name: 'Add attribute' }).click();
		await modal.getByPlaceholder('Key').fill('k1');
		await modal.getByPlaceholder('Value').fill('value1');
		await modal.getByRole('button', { name: 'Add attribute' }).click();
		await modal.getByPlaceholder('Key').nth(1).fill('k2');
		await modal.getByPlaceholder('Value').nth(1).fill('42');
		await modal.getByRole('combobox').nth(1).selectOption('Number');
		await modal.getByRole('button', { name: 'Add attribute' }).click();
		await modal.getByPlaceholder('Key').nth(2).fill('k3');
		await modal.getByPlaceholder('Value').nth(2).fill('true');
		await modal.getByRole('combobox').nth(2).selectOption('Boolean');
		await modal.getByRole('button', { name: 'Add type' }).click();
		await modal.getByPlaceholder('Key').nth(3).fill('k4');
		let saveBtn = modal.getByRole('button', { name: 'Save' });
		await saveBtn.click();
		await waitModalClosed(page);
		await page.getByRole('button', { name: 'Add an image list entry' }).click();
		modal = page.locator('.modal.show');
		await modal.waitFor();
		await modal
			.getByRole('textbox', { name: 'Zarr URL' })
			.fill(`/tmp/playwright/datasets/${datasetName}/img2`);
		await modal.getByRole('button', { name: 'Add attribute' }).click();
		await modal.getByPlaceholder('Key').fill('k1');
		await modal.getByPlaceholder('Value').fill('value2');
		await modal.getByRole('button', { name: 'Add type' }).click();
		await modal.getByPlaceholder('Key').nth(1).fill('k4');
		await modal.getByRole('switch').check();
		saveBtn = modal.getByRole('button', { name: 'Save' });
		await saveBtn.click();
		await waitModalClosed(page);
	});

	await test.step('Open workflow page', async () => {
		await workflow.openWorkflowPage();
	});

	await test.step('Add tasks to workflow', async () => {
		await workflow.addTask(taskName1);
		await workflow.addTask(taskName2);
		await workflow.selectTask(taskName1);
	});

	await test.step('Open Input Filters tab', async () => {
		await page.getByText('Input Filters').click();
	});

	await test.step('Add empty attribute filter and trigger validation', async () => {
		await page.getByRole('button', { name: 'Add type filter', exact: true }).click();
		await page.getByRole('button', { name: 'Save' }).click();
		await page.getByText('Key is required').waitFor();
	});

	await test.step('Add valid filters', async () => {
		await page.getByPlaceholder('Key').fill('key2');
		await page.getByRole('button', { name: 'Save' }).click();
		await page.getByText('Input filters successfully updated').waitFor();
	});

	await test.step('Reload the page and check saved filters', async () => {
		await page.reload();
		await workflow.selectTask(taskName1);
		await page.getByText('Input Filters').click();
		await expect(page.getByPlaceholder('Key')).toHaveValue('key2');
	});

	await test.step('Trigger pending changes modal from changing tab', async () => {
		await page.getByPlaceholder('Key').fill('key2-mod');
		await page.getByRole('button', { name: 'Info', exact: true }).click();
		const modal = page.locator('.modal.show');
		await modal.waitFor();
		await page.getByText('There are filter changes unsaved').waitFor();
		await modal.getByRole('button', { name: 'Cancel' }).click();
		await waitModalClosed(page);
		await expect(page.getByPlaceholder('Key')).toHaveValue('key2-mod');
	});

	await test.step('Select dataset', async () => {
		await page.getByRole('combobox', { name: 'Dataset', exact: true }).selectOption(datasetName);
	});

	await test.step('Trigger pending changes modal from clicking to "Run workflow" button', async () => {
		await page.getByRole('button', { name: 'Run workflow' }).click();
		const modal = page.locator('.modal.show');
		await modal.waitFor();
		await page.getByText('There are filter changes unsaved').waitFor();
		await modal.getByRole('button', { name: 'Cancel' }).click();
		await waitModalClosed(page);
		await expect(page.getByPlaceholder('Key')).toHaveValue('key2-mod');
	});

	await test.step('Trigger pending changes modal from navigation', async () => {
		await page.getByRole('link', { name: 'List jobs' }).click();
		const modal = page.locator('.modal.show');
		await modal.waitFor();
		await page.getByText('There are filter changes unsaved').waitFor();
		await modal.getByRole('button', { name: 'Cancel' }).click();
		await waitModalClosed(page);
		await expect(page.getByPlaceholder('Key')).toHaveValue('key2-mod');
	});

	await test.step('Trigger pending changes modal from changing task selection, discard changes', async () => {
		await expect(page.locator('.list-group .list-group-item-action.active')).toContainText(
			taskName1
		);
		await workflow.selectTask(taskName2);
		const modal = page.locator('.modal.show');
		await modal.waitFor();
		await page.getByText('There are filter changes unsaved').waitFor();
		await modal.getByRole('button', { name: 'Discard changes' }).click();
		await waitModalClosed(page);
		await expect(page.locator('.list-group .list-group-item-action.active')).toContainText(
			taskName2
		);
		await workflow.selectTask(taskName1);
		await expect(page.getByPlaceholder('Key')).toHaveValue('key2');
	});

	await test.step('Trigger pending changes modal from changing task selection, save changes', async () => {
		await expect(page.locator('.list-group .list-group-item-action.active')).toContainText(
			taskName1
		);
		await page.getByPlaceholder('Key').fill('key2-mod');
		await workflow.selectTask(taskName2);
		const modal = page.locator('.modal.show');
		await modal.waitFor();
		await page.getByText('There are filter changes unsaved').waitFor();
		await modal.getByRole('button', { name: 'Save changes' }).click();
		await waitModalClosed(page);
		await page.getByText('Input filters successfully updated').waitFor();
		await expect(page.locator('.list-group .list-group-item-action.active')).toContainText(
			taskName1
		);
		await page.getByPlaceholder('Key').fill('key2-mod');
	});

	await test.step('Select task2', async () => {
		await workflow.selectTask(taskName2);
	});

	await test.step('Add type filter from dataset', async () => {
		await page.getByRole('button', { name: 'Add type filter from dataset' }).click();
		const modal = page.locator('.modal.show');
		await modal.waitFor();
		await modal.getByRole('combobox', { name: 'Type Key' }).selectOption('k4');
		await modal.getByRole('button', { name: 'Add' }).click();
		await waitModalClosed(page);
		await expect(page.getByPlaceholder('Key')).toHaveCount(1);
		await expect(page.getByPlaceholder('Key')).toHaveValue('k4');
		await expect(page.getByRole('switch')).toBeChecked();
	});

	await test.step('Add already existing type filter from dataset', async () => {
		await page.getByRole('button', { name: 'Add type filter from dataset' }).click();
		const modal = page.locator('.modal.show');
		await modal.waitFor();
		await modal.getByRole('combobox', { name: 'Type Key' }).selectOption('k4');
		await modal.getByRole('combobox', { name: 'Type Value' }).selectOption('False');
		await modal.getByRole('button', { name: 'Add' }).click();
		await waitModalClosed(page);
		await expect(page.getByPlaceholder('Key')).toHaveCount(1);
		await expect(page.getByPlaceholder('Key')).toHaveValue('k4');
		await expect(page.getByRole('switch')).not.toBeChecked();
	});

	await test.step('Cleanup', async () => {
		await workflow.removeCurrentTask();
		await workflow.selectTask(taskName1);
		await workflow.removeCurrentTask();
		await deleteTask(page, taskName1);
		await deleteTask(page, taskName2);
	});
});
