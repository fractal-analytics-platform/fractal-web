import { expect, test } from './workflow_fixture.js';

test('Execute a job and show it on the job tables', async ({ page, workflow }) => {
	await page.waitForURL(workflow.url);

	// Add task to workflow
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

	// Run workflow
	const runWorkflowBtn = page.getByRole('button', { name: 'Run workflow' });
	await runWorkflowBtn.click();
	modalTitle = page.locator('.modal.show .modal-title');
	await modalTitle.waitFor();
	await expect(modalTitle).toHaveText('Run workflow');

	await page.selectOption('[name="inputDataset"]', 'input');
	await page.selectOption('[name="outputDataset"]', 'output');
	const runBtn = page.locator('.modal.show').getByRole('button', { name: 'Run' });
	await runBtn.click();
	const confirmBtn = page.locator('.modal.show').getByRole('button', { name: 'Confirm' });
	await confirmBtn.click();

	// Check workflow jobs page
	await page.waitForURL(`/projects/${workflow.projectId}/workflows/${workflow.workflowId}`);
	await page.locator('table tbody').waitFor();
	expect(await page.locator('table tbody tr').count()).toEqual(1);
	const cells = await page.locator('table tbody tr td').allInnerTexts();
	const jobId = cells[0];
	expect(cells[3]).toEqual('input');
	expect(cells[4]).toEqual('output');

	// Open Info modal
	await page.locator('table tbody tr').getByRole('button', { name: 'Info' }).click();
	modalTitle = page.locator('.modal.show .modal-title');
	await modalTitle.waitFor();
	await expect(modalTitle).toHaveText(`Workflow Job #${jobId}`);

	const items = await page.locator('.modal.show').getByRole('listitem').allInnerTexts();
	expect(items[0]).toEqual('Id');
	expect(items[1]).toEqual(jobId);
	expect(items[2]).toEqual('Workflow');
	expect(items[3]).toEqual(workflow.workflowName);
	expect(items[4]).toEqual('Project');
	expect(items[5]).toEqual(workflow.projectName);
	expect(items[6]).toEqual('Input dataset');
	expect(items[7]).toEqual('input');
	expect(items[8]).toEqual('Output dataset');
	expect(items[9]).toEqual('output');

	// Check generic jobs page
	await page.goto('/jobs');
	await page.locator('table tbody').waitFor();
	const rows = await page.locator('table tbody tr').all();
	let jobRow = null;
	for (const row of rows) {
		const id = await row.locator('td').first().innerText();
		if (id === jobId) {
			jobRow = row;
			const cells = await row.locator('td').allInnerTexts();
			expect(cells[3]).toEqual(workflow.projectName);
			expect(cells[4]).toEqual(workflow.workflowName);
			expect(cells[5]).toEqual('input');
			expect(cells[6]).toEqual('output');
			break;
		}
	}
	expect(jobRow).not.toBeNull();

	// Open Logs modal
	const logsButton = jobRow?.getByRole('button', { name: 'Logs' });
	await logsButton?.waitFor();
	await logsButton?.click();
	modalTitle = page.locator('.modal.show .modal-title');
	await modalTitle.waitFor();
	await expect(modalTitle).toHaveText('Workflow Job logs');
	expect(await page.locator('.modal.show .modal-body').innerText()).toContain('TASK ERROR');
});
