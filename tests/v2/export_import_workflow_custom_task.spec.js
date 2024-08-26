import { expect, test } from './workflow_fixture.js';
import { waitModalClosed, waitPageLoading } from '../utils.js';
import path from 'path';
import { createFakeTask, deleteTask } from './task_utils.js';
import os from 'os';
import fs from 'fs';

test('Export and re-import a workflow with a custom task', async ({ page, workflow }) => {
	await page.waitForURL(workflow.url);
	await waitPageLoading(page);

	let taskName;
	await test.step('Create test task', async () => {
		taskName = await createFakeTask(page, {
			type: 'non_parallel'
		});
	});

	await test.step('Open workflow page', async () => {
		await workflow.openWorkflowPage();
	});

	await test.step('Add task to workflow', async () => {
		await workflow.addUserTask(taskName);
	});

	let downloadedFile;
	await test.step('Export workflow and verify warning message', async () => {
		const downloadPromise = page.waitForEvent('download');
		await page.getByLabel('Export workflow').click();
		const download = await downloadPromise;
		downloadedFile = path.join(os.tmpdir(), download.suggestedFilename());
		await download.saveAs(downloadedFile);
		await expect(page.getByText('are not meant to be portable')).toBeVisible();
	});

	await test.step('Open project page', async () => {
		await page.goto(`/v2/projects/${workflow.projectId}`);
	});

	await test.step('Open "Create new workflow" modal', async () => {
		const createWorkflowBtn = page.getByRole('button', { name: 'Create new workflow' });
		await createWorkflowBtn.waitFor();
		await createWorkflowBtn.click();
		const modalTitle = page.locator('.modal.show .modal-title');
		await modalTitle.waitFor();
		await expect(modalTitle).toHaveText('Create new workflow');
	});

	await test.step('Import the workflow and verify warning message', async () => {
		await page
			.getByRole('textbox', { name: 'Workflow name' })
			.fill(`${workflow.workflowName}-imported`);
		const fileChooserPromise = page.waitForEvent('filechooser');
		await page.getByText('Import workflow from file').click();
		const fileChooser = await fileChooserPromise;
		await fileChooser.setFiles(downloadedFile);
		await page.getByRole('button', { name: 'Import workflow' }).click();
		await expect(page.getByText('are not meant to be portable')).toBeVisible();
	});

	await test.step('Cleanup', async () => {
		await deleteWorkflow();
		await deleteWorkflow();
		await deleteTask(page, taskName);
		fs.rmSync(downloadedFile);
	});

	async function deleteWorkflow() {
		await page.getByRole('button', { name: 'Delete' }).first().click();
		const modalTitle = page.locator('.modal.show .modal-title');
		await modalTitle.waitFor();
		await page.getByRole('button', { name: 'Confirm' }).click();
		await waitModalClosed(page);
	}
});
