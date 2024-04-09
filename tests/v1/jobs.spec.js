import { waitPageLoading } from '../utils.js';
import { expect, test } from './workflow_fixture.js';

test('Execute jobs', async ({ page, workflow }) => {
	await page.waitForURL(workflow.url);
	await waitPageLoading(page);

	await test.step('Add task to workflow', async () => {
		await workflow.addFakeTask();
	});

	await test.step('Run workflow', async () => {
		const runWorkflowBtn = page.getByRole('button', { name: 'Run workflow' });
		await runWorkflowBtn.click();
		const modalTitle = page.locator('.modal.show .modal-title');
		await modalTitle.waitFor();
		await expect(modalTitle).toHaveText('Run workflow');

		await page.selectOption('[name="inputDataset"]', 'input');
		await page.selectOption('[name="outputDataset"]', 'output');
		const runBtn = page.locator('.modal.show').getByRole('button', { name: 'Run' });
		await runBtn.click();
		const confirmBtn = page.locator('.modal.show').getByRole('button', { name: 'Confirm' });
		await confirmBtn.click();
	});

	await test.step('Check workflow jobs page', async () => {
		await page.waitForURL(`/v1/projects/${workflow.projectId}/workflows/${workflow.workflowId}/jobs`);
		await page.locator('table tbody').waitFor();
		expect(await page.locator('table tbody tr').count()).toEqual(1);
		const cells = await page.locator('table tbody tr td').allInnerTexts();
		expect(cells[4]).toEqual('input');
		expect(cells[5]).toEqual('output');
	});

	/** @type {string|null} */
	let jobId = null;
	await test.step('Open Info modal', async () => {
		await page.locator('table tbody tr').getByRole('button', { name: 'Info' }).click();
		const modalTitle = page.locator('.modal.show .modal-title');
		await modalTitle.waitFor();
		await expect(modalTitle).toContainText(`Workflow Job #`);

		const items = await page.locator('.modal.show').getByRole('listitem').allInnerTexts();
		expect(items[0]).toEqual('Id');
		jobId = items[1];
		expect(items[2]).toEqual('Workflow');
		expect(items[3]).toEqual(workflow.workflowName);
		expect(items[4]).toEqual('Project');
		expect(items[5]).toEqual(workflow.projectName);
		expect(items[6]).toEqual('Input dataset');
		expect(items[7]).toEqual('input');
		expect(items[8]).toEqual('Output dataset');
		expect(items[9]).toEqual('output');
	});

	let jobRow = null;
	await test.step('Check generic jobs page', async () => {
		await page.goto('/v1/jobs');
		await waitPageLoading(page);
		const rows = await page.locator('table tbody tr').all();
		for (const row of rows) {
			const id = await getJobId(page, row);
			if (id === jobId) {
				jobRow = row;
				const cells = await row.locator('td').allInnerTexts();
				expect(cells[4]).toEqual(workflow.projectName);
				expect(cells[5]).toEqual(workflow.workflowName);
				expect(cells[6]).toEqual('input');
				expect(cells[7]).toEqual('output');
				break;
			}
		}
		expect(jobRow).not.toBeNull();
	});

	await test.step('Open Logs modal', async () => {
		/** @type {import('@playwright/test').Locator} */
		const logsButton = jobRow?.getByRole('button', { name: 'Logs' });
		await logsButton.waitFor();
		await logsButton.click();
		const modalTitle = page.locator('.modal.show .modal-title');
		await modalTitle.waitFor();
		await expect(modalTitle).toHaveText('Workflow Job logs');
		await workflow.triggerTaskFailure();
		await page.waitForFunction(() => {
			const modalBody = document.querySelector('.modal.show .modal-body');
			return modalBody instanceof HTMLElement && modalBody.innerText.includes('TASK ERROR');
		});
	});
});

/**
 * @param {import('@playwright/test').Page} page
 * @param {import('@playwright/test').Locator} row
 * @returns {Promise<string>}
 */
async function getJobId(page, row) {
	await row.getByRole('button', { name: 'Info' }).click();
	const modalTitle = page.locator('.modal.show .modal-title');
	await modalTitle.waitFor();
	const text = await modalTitle.innerText();
	const match = text.match('Workflow Job #(\\d+)');
	expect(match).not.toBeNull();
	await page.locator('.modal.show .modal-header [aria-label="Close"]').click();
	return /** @type {RegExpMatchArray} */ (match)[1];
}
