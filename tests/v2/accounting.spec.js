import { expect, test } from './workflow_fixture.js';
import { waitModalClosed, waitPageLoading } from '../utils.js';
import { createDataset } from './dataset_utils.js';
import { waitTaskSubmitted, waitTasksSuccess } from './workflow_task_utils.js';
import fs from 'fs';

test('Display accounting page', async ({ page, workflow }) => {
	await page.waitForURL(workflow.url);
	await waitPageLoading(page);

	await test.step('Create test dataset', async () => {
		await createDataset(page, workflow.projectId);
	});

	await test.step('Go to workflow page and add generic_task', async () => {
		await page.goto(workflow.url);
		await waitPageLoading(page);
		await workflow.addTask('generic_task');
	});

	await test.step('Start the job', async () => {
		await page.getByRole('button', { name: 'Run workflow' }).click();
		const modal = page.locator('.modal.show');
		await modal.waitFor();
		await page.getByRole('button', { name: 'Run', exact: true }).click();
		await page.getByRole('button', { name: 'Confirm' }).click();
		await waitModalClosed(page);
	});

	await test.step('Wait tasks submitted', async () => {
		await waitTaskSubmitted(page);
	});

	await test.step('Wait task success', async () => {
		await waitTasksSuccess(page);
	});

	/** @type {number} */
	let totalResults;
	await test.step('Open accounting page and search', async () => {
		await page.goto('/v2/admin/accounting');
		await waitPageLoading(page);
		await page.getByRole('button', { name: 'Search' }).click();
		const counterElement = page.getByText(/Total results: (\d+)/);
		await expect(counterElement).toBeVisible();
		const text = (await counterElement.textContent()) || '';
		const match = text.match(/Total results: (\d+)/);
		totalResults = match ? parseInt(match[1], 10) : 0;
		expect(totalResults).toBeGreaterThan(0);
	});

	await test.step('Export to CSV', async () => {
		const downloadPromise = page.waitForEvent('download');
		await page.getByRole('button', { name: 'Export to CSV' }).click();
		const download = await downloadPromise;
		const content = fs.readFileSync(await download.path(), 'utf8');
		expect(content.split('\n').length).toEqual(totalResults + 1);
	});
});
