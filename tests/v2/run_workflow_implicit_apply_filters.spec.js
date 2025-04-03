import { expect, test } from './workflow_fixture.js';
import { getSlimSelectValues, selectSlimSelect, waitPageLoading } from '../utils.js';
import { createImage } from './image_utils.js';
import { createDataset } from './dataset_utils.js';

test('Run workflow implicit applies changed filters [#694]', async ({ page, workflow }) => {
	await page.waitForURL(workflow.url);
	await waitPageLoading(page);

	const modal = page.locator('.modal.show');

	let datasetName;
	await test.step('Create test dataset1 and open dataset page', async () => {
		const { name } = await createDataset(page, workflow.projectId);
		datasetName = name;
		await page.getByRole('link', { name: datasetName }).click();
		await waitPageLoading(page);
	});

	await test.step('Create test images for dataset1', async () => {
		await createImage(
			page,
			`/tmp/playwright/datasets/${datasetName}/img1`,
			{ a1: 'v1' },
			{ t1: true }
		);
		await createImage(
			page,
			`/tmp/playwright/datasets/${datasetName}/img2`,
			{ a1: 'v2' },
			{ t1: true }
		);
	});

	await test.step('Add generic_task', async () => {
		await page.goto(workflow.url);
		await waitPageLoading(page);
		await workflow.addTask('generic_task');
		await workflow.selectTask('generic_task');
	});

	await test.step('Add type filter', async () => {
		await page.getByRole('button', { name: 'Types', exact: true }).click();
		await page.getByRole('button', { name: 'Add type filter' }).click();
		await page.getByPlaceholder('Key').fill('t1');
		await page.getByRole('switch').check();
		await page.getByRole('button', { name: 'Save' }).click();
		await expect(page.getByText('Input filters successfully updated')).toBeVisible();
	});

	await test.step('Open "Run workflow" modal', async () => {
		await page.getByRole('button', { name: 'Run workflow' }).click();
		await modal.waitFor();
		// check images and selected filters
		let values = await getSlimSelectValues(page, page.getByLabel('Selector for attribute a1'));
		expect(values).toHaveLength(0);
		values = await getSlimSelectValues(page, page.getByLabel('Selector for type t1'));
		expect(values).toHaveLength(1);
		expect(/** @type {string[]} */ (values)[0]).toEqual('True');
		await expect(modal.getByRole('button', { name: 'Apply' })).toBeDisabled();
		await expect(page.getByText('Total results: 2')).toBeVisible();
	});

	await test.step('Add a filter and click on Run without clicking Apply', async () => {
		await selectSlimSelect(page, page.getByLabel('Selector for attribute a1'), 'v1', true);
		await expect(modal.getByRole('button', { name: 'Apply' })).toBeEnabled();
		await modal.getByRole('button', { name: 'Run', exact: true }).click();
	});

	await test.step('Check filters have been applied in any case', async () => {
		await expect(modal.getByText('This job will process 1 image')).toBeVisible();
		await expect(modal.getByRole('listitem').nth(0)).toContainText('v1');
		await expect(modal.getByRole('listitem').nth(1)).toContainText('t1');
	});

	await test.step('Click cancel and check that filters have been reset', async () => {
		await modal.getByRole('button', { name: 'Cancel' }).click();
		let values = await getSlimSelectValues(page, page.getByLabel('Selector for attribute a1'));
		expect(values).toHaveLength(0);
		values = await getSlimSelectValues(page, page.getByLabel('Selector for type t1'));
		expect(values).toHaveLength(1);
		expect(/** @type {string[]} */ (values)[0]).toEqual('True');
		await expect(page.getByText('Total results: 2')).toBeVisible();
		await expect(modal.getByRole('button', { name: 'Apply' })).toBeDisabled();
	});

	await test.step('Click Run and check', async () => {
		await modal.getByRole('button', { name: 'Run', exact: true }).click();
		await expect(modal.getByText('This job will process 2 images')).toBeVisible();
		await expect(modal.getByRole('listitem')).toContainText('t1');
		await expect(modal.getByRole('listitem')).not.toContainText('v1');
	});
});
