import { waitPageLoading } from '../utils.js';
import { createDataset } from './dataset_utils.js';
import { expect, test } from './workflow_fixture.js';
import { waitTaskSubmitted, waitTasksSuccess } from './workflow_task_utils.js';

test('Add SLURM accounts for the admin and execute workflow using a specific account', async ({
	page,
	workflow
}) => {
	await page.waitForURL(workflow.url);
	await waitPageLoading(page);

	await test.step('Create dataset', async () => {
		await createDataset(page, workflow.projectId);
	});

	await test.step('Open the edit user page for admin user', async () => {
		await page.goto('/v2/admin/users/1/edit');
		await waitPageLoading(page);
	});

	const randomSlurmAccount = Math.random().toString(36).substring(7);

	await test.step('Add SLURM account to the admin', async () => {
		await page.getByRole('button', { name: 'Add SLURM account' }).click();
		await page
			.getByLabel(/^SLURM account #/)
			.last()
			.fill(randomSlurmAccount);
		await page.getByRole('button', { name: 'Save' }).nth(1).click();
		await expect(page.getByText('Settings successfully updated')).toBeVisible();
	});

	await test.step('Add task to workflow', async () => {
		await page.goto(workflow.url);
		await waitPageLoading(page);
		await workflow.addCollectedTask('generic_task');
		await workflow.selectTask('generic_task');
	});

	await test.step('Open Run workflow modal', async () => {
		const runWorkflowBtn = page.getByRole('button', { name: 'Run workflow' });
		await runWorkflowBtn.click();
		const modalTitle = page.locator('.modal.show .modal-title');
		await modalTitle.waitFor();
		await expect(modalTitle).toHaveText('Run workflow');
	});

	await test.step('Run workflow with new SLURM account', async () => {
		const modal = page.locator('.modal.show');
		await modal.getByRole('button', { name: 'Advanced Options' }).click();
		await modal.getByRole('combobox', { name: 'SLURM account' }).selectOption(randomSlurmAccount);
		await modal.getByRole('button', { name: 'Run' }).click();
		await modal.getByRole('button', { name: 'Confirm' }).click();
	});

	await test.step('Wait task submitted', async () => {
		await waitTaskSubmitted(page, 1);
	});

	await test.step('Wait for job completion', async () => {
		await waitTasksSuccess(page, 1);
	});

	await test.step('Check SLURM account in workflow info modal', async () => {
		await page.goto(`/v2/projects/${workflow.projectId}/workflows/${workflow.workflowId}/jobs`);
		await page.locator('table tbody').waitFor();
		await page.locator('table tbody tr').getByRole('button', { name: 'Info' }).click();
		const modalTitle = page.locator('.modal.show .modal-title');
		await modalTitle.waitFor();
		await expect(modalTitle).toContainText(`Workflow Job #`);
		const items = await page.locator('.modal.show').getByRole('listitem').allInnerTexts();
		expect(items[items.length - 2]).toEqual('SLURM account');
		expect(items[items.length - 1]).toEqual(randomSlurmAccount);
	});
});
