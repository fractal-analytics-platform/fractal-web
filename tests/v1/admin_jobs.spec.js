import { expect, test } from '@playwright/test';
import { waitPageLoading } from '../utils.js';
import { PageWithWorkflow } from './workflow_fixture.js';
import * as fs from 'fs';

test('Execute a job and show it on the job tables [v1]', async ({ page, request }) => {
	/** @type {PageWithWorkflow} */
	let workflow1;
	await test.step('Create first job and wait its failure', async () => {
		workflow1 = await createJob(page, request, 'input', 'output');
		await workflow1.triggerTaskFailure();
		const jobBadge = page.locator('.badge.text-bg-danger');
		await jobBadge.waitFor();
		expect(await jobBadge.innerText()).toEqual('failed');
		await workflow1.deleteProject();
	});

	/** @type {PageWithWorkflow} */
	let workflow2;
	await test.step('Create second job', async () => {
		workflow2 = await createJob(page, request, 'input2', 'output2');
	});

	await test.step('Open the admin jobs', async () => {
		await page.goto('/v1/admin/jobs');
		await waitPageLoading(page);
		await page.getByRole('button', { name: 'Search jobs' }).waitFor();
	});

	await test.step('Search with empty form fields', async () => {
		await search(page);

		const row1 = await getWorkflowRow(page, workflow1.workflowName);
		const cells1 = await row1.locator('td').all();
		expect(await cells1[5].innerText()).toEqual('-');
		expect(await cells1[7].innerText()).toEqual('input');
		expect(await cells1[8].innerText()).toEqual('output');
		expect(await cells1[9].innerText()).toEqual('admin@fractal.xy');

		const row2 = await getWorkflowRow(page, workflow2.workflowName);
		const cells2 = await row2.locator('td').all();
		expect(await cells2[5].innerText()).toEqual(workflow2.projectName);
		expect(await cells2[7].innerText()).toEqual('input2');
		expect(await cells2[8].innerText()).toEqual('output2');
		expect(await cells2[9].innerText()).toEqual('admin@fractal.xy');
	});

	await test.step('Download job logs', async () => {
		const downloadPromise = page.waitForEvent('download');
		await page.getByRole('row', { name: workflow1.workflowName }).getByRole('link').click();
		const download = await downloadPromise;
		const downloadedFile = await download.path();
		expect(fs.statSync(downloadedFile).size).toBeGreaterThan(0);
	});

	await test.step('Download CSV', async () => {
		const downloadPromise = page.waitForEvent('download');
		await page.getByText('Download CSV').click();
		const download = await downloadPromise;
		const content = fs.readFileSync(await download.path(), 'utf8');
		const rowsCount = await page.locator('table tbody tr').count();
		expect(content.split('\n').length).toEqual(rowsCount + 1);
	});

	await test.step('Search workflow2 job', async () => {
		await page.getByText('Reset').click();
		await expect(page.getByRole('table')).not.toBeVisible();
		await page.selectOption('#user', '1');
		await page.locator('#project').fill(workflow2.projectId?.toString() || '');
		await page.locator('#workflow').fill(workflow2.workflowId?.toString() || '');
		await search(page);
		expect(await page.locator('table tbody tr').count()).toEqual(1);
		await getWorkflowRow(page, workflow2.workflowName);
	});

	await test.step('Search running jobs', async () => {
		await page.getByText('Reset').click();
		await expect(page.getByRole('table')).not.toBeVisible();
		await page.selectOption('#status', 'submitted');
		await search(page);
		const statuses = page.locator('table tbody tr td:nth-child(2)');
		await expect(statuses).toHaveCount(1);
		expect((await statuses.allInnerTexts())[0].trim()).toEqual('submitted');
	});

	await test.step('Wait job completion', async () => {
		await workflow2.triggerTaskSuccess();
		const jobBadge = page.locator('.badge.text-bg-success');
		await jobBadge.waitFor();
		expect(await jobBadge.innerText()).toEqual('done');
	});

	await test.step('Search failed jobs', async () => {
		await page.getByText('Reset').click();
		await expect(page.getByRole('table')).not.toBeVisible();
		await page.selectOption('#status', 'failed');
		await search(page);
		const statuses = await page.locator('table tbody tr td:nth-child(2)').allInnerTexts();
		for (const status of statuses) {
			expect(status.trim()).toEqual('failed');
		}
	});

	await test.step('Search by date', async () => {
		await page.getByText('Reset').click();
		await page.selectOption('#status', 'failed');
		await page.locator('#start_date_min').fill('2020-01-01');
		await page.locator('#start_time_min').fill('10:00');
		await page.locator('#start_date_max').fill('2020-01-03');
		await page.locator('#end_date_min').fill('2020-01-01');
		await page.locator('#end_date_max').fill('2020-01-05');
		await page.locator('#end_time_max').fill('23:00');
		await search(page);
		expect(await page.locator('table tbody tr').count()).toEqual(0);
	});

	await test.step('Search by id', async () => {
		await page.getByText('Reset').click();
		await expect(page.getByRole('table')).not.toBeVisible();
		await search(page);
		await expect(page.getByRole('table')).toBeVisible();
		const firstRowId = await page.locator('table tbody tr td:first-child').first().innerText();
		await page.getByRole('spinbutton', { name: 'Job Id' }).fill(firstRowId);
		await search(page);
		expect(await page.locator('table tbody tr').count()).toEqual(1);
	});
});

/**
 * @param {import('@playwright/test').Page} page
 */
async function search(page) {
	const searchJobsBtn = page.getByRole('button', { name: 'Search jobs' });
	await searchJobsBtn.click();
	await page.waitForFunction(
		() => document.querySelectorAll('button .spinner-border').length === 0
	);
}

/**
 * @param {import('@playwright/test').Page} page
 * @param {string} workflowName
 * @returns {Promise<import('@playwright/test').Locator>}
 */
async function getWorkflowRow(page, workflowName) {
	const rows = await page.locator('table tbody tr').all();
	let workflowRow = null;
	for (const row of rows) {
		const cells = await row.locator('td').all();
		if ((await cells[6].innerText()) === workflowName) {
			workflowRow = row;
			break;
		}
	}
	expect(workflowRow).not.toBeNull();
	return /** @type {import('@playwright/test').Locator} */ (workflowRow);
}

/**
 * @param {import('@playwright/test').Page} page
 * @param {import('@playwright/test').APIRequestContext} request
 * @param {string} inputDataset
 * @param {string} outputDataset
 */
async function createJob(page, request, inputDataset, outputDataset) {
	const workflow = new PageWithWorkflow(page, request);
	await test.step('Create workflow', async () => {
		await workflow.createProject();
		await workflow.createDataset(inputDataset, 'image');
		await workflow.createDataset(outputDataset, 'zarr');
		await workflow.createWorkflow();
		await page.waitForURL(/** @type {string} */ (workflow.url));
		await addTaskToWorkflow(workflow);
		await runWorkflow(page, inputDataset, outputDataset);
	});
	return workflow;
}

/**
 * @param {PageWithWorkflow} workflow
 */
async function addTaskToWorkflow(workflow) {
	await test.step('Add task to workflow', async () => {
		await workflow.addFakeTask();
	});
}

/**
 * @param {import('@playwright/test').Page} page
 * @param {string} inputDataset
 * @param {string} outputDataset
 */
async function runWorkflow(page, inputDataset, outputDataset) {
	await test.step('Run workflow', async () => {
		const runWorkflowBtn = page.getByRole('button', { name: 'Run workflow' });
		await runWorkflowBtn.click();
		const modalTitle = page.locator('.modal.show .modal-title');
		await modalTitle.waitFor();
		await expect(modalTitle).toHaveText('Run workflow');
		await page.selectOption('[name="inputDataset"]', inputDataset);
		await page.selectOption('[name="outputDataset"]', outputDataset);
		const runBtn = page.locator('.modal.show').getByRole('button', { name: 'Run' });
		await runBtn.click();
		const confirmBtn = page.locator('.modal.show').getByRole('button', { name: 'Confirm' });
		await confirmBtn.click();
		await page.waitForURL(new RegExp(`/v1/projects/(\\d+)/workflows/(\\d+)/jobs`));
	});
}
