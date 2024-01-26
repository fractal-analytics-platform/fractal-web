import { waitPageLoading } from './utils.js';
import { expect, test } from './workflow_fixture.js';

test('Add SLURM accounts for the admin and execute workflow using a specific account', async ({
	page,
	workflow
}) => {
	await page.waitForURL(workflow.url);
	await waitPageLoading(page);

	await test.step('Open the edit user page for admin user', async () => {
		await page.goto('/admin/users/1/edit');
		await waitPageLoading(page);
	});

	const randomSlurmAccount = Math.random().toString(36).substring(7);

	await test.step('Add SLURM account to the admin', async () => {
		await page.getByRole('button', { name: 'Add SLURM account' }).click();
		await page
			.getByLabel(/^SLURM account #/)
			.last()
			.fill(randomSlurmAccount);
		await page.getByRole('button', { name: 'Save' }).click();
		await page.waitForURL('/admin/users');
		await waitPageLoading(page);
	});

	/**
	 * Notice: when a user modifies their own account the userInfo cached in the store has to be reloaded.
	 * If that doesn't happen the "My Profile" page shows outdated information.
	 */
	await test.step('Check My Profile page (verify userInfo cache invalidation)', async () => {
		await page.getByRole('button', { name: 'admin@fractal.xy' }).click();
		await page.getByRole('link', { name: 'My profile' }).click();
		await page.waitForURL('/profile');
		await waitPageLoading(page);
		await page.getByText(randomSlurmAccount).waitFor();
	});

	await test.step('Open workflow page', async () => {
		await page.goto(workflow.url);
		await waitPageLoading(page);
	});

	await test.step('Add task to workflow', async () => {
		await page.locator('[data-bs-target="#insertTaskModal"]').click();
		let modalTitle = page.locator('.modal.show .modal-title');
		await modalTitle.waitFor();
		await expect(modalTitle).toHaveText('New workflow task');
		const modal = page.locator('.modal.show');
		const selector = modal.getByRole('combobox').first();
		await selector.click();
		const firstItem = page.getByRole('listbox').locator('[aria-selected="false"]').first();
		await firstItem.click();
		await page.locator('#taskId').waitFor();
		await page.getByRole('button', { name: 'Insert' }).click();
	});

	await test.step('Open Run workflow modal', async () => {
		const runWorkflowBtn = page.getByRole('button', { name: 'Run workflow' });
		await runWorkflowBtn.click();
		const modalTitle = page.locator('.modal.show .modal-title');
		await modalTitle.waitFor();
		await expect(modalTitle).toHaveText('Run workflow');
	});

	await test.step('Run workflow with new SLURM account', async () => {
		await page.selectOption('[name="inputDataset"]', 'input');
		await page.selectOption('[name="outputDataset"]', 'output');
		await page.selectOption('[name="slurmAccount"]', randomSlurmAccount);
		const runBtn = page.locator('.modal.show').getByRole('button', { name: 'Run' });
		await runBtn.click();
		const confirmBtn = page.locator('.modal.show').getByRole('button', { name: 'Confirm' });
		await confirmBtn.click();
	});

	await test.step('Check SLURM account in workflow info modal', async () => {
		await page.waitForURL(`/projects/${workflow.projectId}/workflows/${workflow.workflowId}/jobs`);
		await page.locator('table tbody').waitFor();
		await page.locator('table tbody tr').getByRole('button', { name: 'Info' }).click();
		const modalTitle = page.locator('.modal.show .modal-title');
		await modalTitle.waitFor();
		await expect(modalTitle).toContainText(`Workflow Job #`);
		const items = await page.locator('.modal.show').getByRole('listitem').allInnerTexts();
		expect(items[16]).toEqual('SLURM account');
		expect(items[17]).toEqual(randomSlurmAccount);
	});

	await test.step('Wait for job completion', async () => {
		await page.getByRole('table').getByText('failed', { exact: true }).waitFor();
	})
});
