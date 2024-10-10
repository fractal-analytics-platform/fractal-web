import { expect, test } from '@playwright/test';
import { waitModalClosed, waitPageLoading } from '../utils.js';
import { PageWithWorkflow } from './workflow_fixture.js';
import * as fs from 'fs';
import { createDataset } from './dataset_utils.js';
import { createFakeTask } from './task_utils.js';
import { waitTaskFailure, waitTaskSubmitted } from './workflow_task_utils.js';

test('Execute a job and show it on the job tables [v2]', async ({ page, request }) => {
	let taskName;
	await test.step('Create test tasks', async () => {
		taskName = await createFakeTask(page, {
			type: 'non_parallel'
		});
	});

	/** @type {PageWithWorkflow} */
	let workflow1;
	/** @type {string} */
	let dataset1;
	await test.step('Create first job and wait its failure', async () => {
		const job = await createJob(page, request, async function (workflow) {
			await workflow.addTask('generic_task');
			await workflow.selectTask('generic_task');
			await page.getByRole('switch').check();
			await page.getByRole('button', { name: 'Save changes' }).click();
			await page.getByText('Arguments changes saved successfully').waitFor();
		});
		workflow1 = job.workflow;
		dataset1 = job.dataset;
		await waitTaskSubmitted(page, 1);
		await waitTaskFailure(page);
		await workflow1.deleteProject();
	});

	/** @type {PageWithWorkflow} */
	let workflow2;
	/** @type {string} */
	let dataset2;
	/** @type {number} */
	let jobId2;
	await test.step('Create second job', async () => {
		const job = await createJob(page, request, async function (workflow) {
			await workflow.addTask(taskName);
		});
		workflow2 = job.workflow;
		dataset2 = job.dataset;
		jobId2 = job.jobId;
		await waitTaskSubmitted(page, 1);
	});

	await test.step('Open the admin jobs', async () => {
		await page.goto('/v2/admin/jobs');
		await waitPageLoading(page);
		await page.getByRole('button', { name: 'Search jobs' }).waitFor();
	});

	await test.step('Search with empty form fields', async () => {
		await search(page);

		const row1 = await getWorkflowRow(page, workflow1.workflowName);
		const cells1 = await row1.locator('td').all();
		expect(await cells1[5].innerText()).toEqual(workflow1.projectName);
		expect(await cells1[7].innerText()).toEqual(dataset1);
		expect(await cells1[8].innerText()).toEqual('admin@fractal.xy');

		const row2 = await getWorkflowRow(page, workflow2.workflowName);
		const cells2 = await row2.locator('td').all();
		expect(await cells2[5].innerText()).toEqual(workflow2.projectName);
		expect(await cells2[7].innerText()).toEqual(dataset2);
		expect(await cells2[8].innerText()).toEqual('admin@fractal.xy');
	});

	await test.step('Download CSV', async () => {
		const downloadPromise = page.waitForEvent('download');
		await page.getByText('Download CSV').click();
		const download = await downloadPromise;
		const content = fs.readFileSync(await download.path(), 'utf8');
		const rowsCount = await page.locator('table tbody tr').count();
		expect(content.split('\n').length).toEqual(rowsCount + 1);
	});

	await test.step('Download job logs', async () => {
		const downloadPromise = page.waitForEvent('download');
		await page.getByRole('row', { name: workflow1.workflowName }).getByRole('link').click();
		const download = await downloadPromise;
		const downloadedFile = await download.path();
		expect(fs.statSync(downloadedFile).size).toBeGreaterThan(0);
	});

	await test.step('Search workflow2 job', async () => {
		await page.getByText('Reset').click();
		await page.selectOption('#user', '1');
		await page.locator('#project').fill(workflow2.projectId?.toString() || '');
		await page.locator('#workflow').fill(workflow2.workflowId?.toString() || '');
		await search(page);
		expect(await page.locator('table tbody tr').count()).toEqual(1);
		await getWorkflowRow(page, workflow2.workflowName);
	});

	await test.step('Search running jobs', async () => {
		await page.getByText('Reset').click();
		await page.getByRole('combobox', { name: 'Status' }).selectOption('submitted');
		await page.getByRole('spinbutton', { name: 'Project Id' }).fill(workflow2.projectId || '');
		await page.getByRole('spinbutton', { name: 'Workflow Id' }).fill(workflow2.workflowId || '');
		await search(page);
		const statuses = page.locator('table tbody tr td:nth-child(2)');
		await expect(statuses).toHaveCount(1);
		expect((await statuses.allInnerTexts())[0].trim()).toEqual('submitted');
	});

	await test.step('Wait job completion', async () => {
		await workflow2.triggerTaskSuccess(jobId2);
		const jobBadge = page.locator('.badge.text-bg-success');
		await jobBadge.waitFor();
		expect(await jobBadge.innerText()).toEqual('done');
	});

	await test.step('Search failed jobs', async () => {
		await page.getByText('Reset').click();
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
 * @param {(workflow: PageWithWorkflow) => Promise<void>} addTask
 * @returns {Promise<{ workflow: PageWithWorkflow, dataset: string, jobId: number }>}
 */
async function createJob(page, request, addTask) {
	const workflow = new PageWithWorkflow(page, request);
	let datasetName = '';
	/** @type {number|undefined} */
	let jobId;
	await test.step('Create workflow', async () => {
		const projectId = await workflow.createProject();
		const datasetResult = await createDataset(page, projectId);
		datasetName = datasetResult.name;
		await workflow.createWorkflow();
		await page.waitForURL(/** @type {string} */ (workflow.url));
		await addTask(workflow);
		jobId = await runWorkflow(page, datasetName);
	});
	return { workflow, dataset: datasetName, jobId: /** @type {number} */ (jobId) };
}

/**
 * @param {import('@playwright/test').Page} page
 * @param {string} dataset
 * @returns {Promise<number>} the id of the job
 */
async function runWorkflow(page, dataset) {
	/** @type {number|undefined} */
	let jobId;
	await test.step('Run workflow', async () => {
		await page
			.getByRole('combobox', { name: 'Dataset', exact: true })
			.first()
			.selectOption(dataset);
		const runWorkflowBtn = page.getByRole('button', { name: 'Run workflow' });
		await runWorkflowBtn.click();
		const modalTitle = page.locator('.modal.show .modal-title');
		await modalTitle.waitFor();
		await expect(modalTitle).toHaveText('Run workflow');
		const runBtn = page.locator('.modal.show').getByRole('button', { name: 'Run' });
		await runBtn.click();
		const confirmBtn = page.locator('.modal.show').getByRole('button', { name: 'Confirm' });
		await confirmBtn.click();
		await page.getByRole('link', { name: 'List jobs' }).click();
		await waitPageLoading(page);
		await page
			.getByRole('row', { name: 'submitted' })
			.getByRole('button', { name: 'Info' })
			.click();
		const modal = page.locator('.modal.show');
		await modal.waitFor();
		const value = await modal.getByRole('listitem').nth(1).textContent();
		jobId = Number(value?.trim());
		await modal.getByRole('button', { name: 'Close' }).click();
		await waitModalClosed(page);
		await page.goBack();
	});
	return /** @type {number} */ (jobId);
}
