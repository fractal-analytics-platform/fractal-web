import { expect, test } from './workflow_fixture.js';
import {
	getSlimSelectValues,
	selectSlimSelect,
	waitModalClosed,
	waitPageLoading
} from '../utils.js';
import { createDataset } from './dataset_utils.js';
import { createImage } from './image_utils.js';
import { waitTaskSubmitted, waitTasksSuccess } from './workflow_task_utils.js';

test('Switching datasets on continue workflow applies correct filters [#695]', async ({
	page,
	workflow
}) => {
  test.slow();

	await page.waitForURL(workflow.url);
	await waitPageLoading(page);

	let datasetName1;
	await test.step('Create test dataset1 and open dataset page', async () => {
		const { name } = await createDataset(page, workflow.projectId);
		datasetName1 = name;
		await page.getByRole('link', { name: datasetName1 }).click();
		await waitPageLoading(page);
	});

	await test.step('Create test images for dataset1', async () => {
		await createImage(page, `/tmp/playwright/datasets/${datasetName1}/img1`, { d1a1: 'd1v1' });
		await createImage(page, `/tmp/playwright/datasets/${datasetName1}/img2`, { d1a1: 'd1v2' });
	});

	await test.step('Create filters for dataset1', async () => {
		await page.getByText('Dataset filters').click();
		await selectSlimSelect(page, page.getByLabel('Selector for attribute d1a1'), 'd1v1');
		await page.getByRole('button', { name: 'Apply' }).click();
		await page.getByRole('button', { name: 'Save filters' }).click();
		await expect(page.getByRole('button', { name: 'Save filters' })).toBeDisabled();
	});

	let datasetName2;
	await test.step('Create test dataset2 and open dataset page', async () => {
		const { name } = await createDataset(page, workflow.projectId);
		datasetName2 = name;
		await page.getByRole('link', { name: datasetName2 }).click();
		await waitPageLoading(page);
	});

	await test.step('Create test image for dataset2', async () => {
		await createImage(page, `/tmp/playwright/datasets/${datasetName2}/img3`, { d2a1: 'd2v1' });
		await createImage(page, `/tmp/playwright/datasets/${datasetName2}/img4`, { d2a1: 'd2v2' });
	});

	await test.step('Create filters for dataset2', async () => {
		await page.getByText('Dataset filters').click();
		await selectSlimSelect(page, page.getByLabel('Selector for attribute d2a1'), 'd2v2');
		await page.getByRole('button', { name: 'Apply' }).click();
		await page.getByRole('button', { name: 'Save filters' }).click();
		await expect(page.getByRole('button', { name: 'Save filters' })).toBeDisabled();
	});

	await test.step('Run workflow', async () => {
		await page.goto(workflow.url);
		await waitPageLoading(page);
		await workflow.addTask('generic_task');
		await page.getByRole('button', { name: 'Run workflow' }).click();
		const modal = page.locator('.modal.show');
		await modal.waitFor();

		// check images and selected filters
		await modal.getByRole('button', { name: 'Image list' }).click();
		const values = await getSlimSelectValues(page, page.getByLabel('Selector for attribute d2a1'));
		expect(values).toHaveLength(1);
		expect(/** @type {string[]} */ (values)[0]).toEqual('d2v2');

		await modal.getByRole('button', { name: 'Run', exact: true }).click();

		// Check filters on confimation page
		await expect(modal.getByText('This job will process 1 image')).toBeVisible();
		await expect(modal.getByRole('listitem')).toContainText('d2v2');

		await modal.getByRole('button', { name: 'Confirm' }).click();
		await waitModalClosed(page);
	});

	await test.step('Wait tasks submitted', async () => {
		await waitTaskSubmitted(page, 1);
	});

	await test.step('Wait task success', async () => {
		await waitTasksSuccess(page, 1);
	});

	await test.step('Select the first dataset', async () => {
		await page
			.getByRole('combobox', { name: 'Dataset', exact: true })
			.first()
			.selectOption(datasetName1);
	});

	await test.step('Check Run workflow modal', async () => {
		await page.getByRole('button', { name: 'Run workflow' }).click();
		const modal = page.locator('.modal.show');
		await modal.waitFor();
		await modal.getByRole('combobox', { name: 'First task' }).selectOption('generic_task');

		// check images and selected filters
		await modal.getByRole('button', { name: 'Image list' }).click();
		const values = await getSlimSelectValues(page, page.getByLabel('Selector for attribute d1a1'));
		expect(values).toHaveLength(1);
		expect(/** @type {string[]} */ (values)[0]).toEqual('d1v1');

		await modal.getByRole('button', { name: 'Run', exact: true }).click();

		// Check filters on confimation page
		await expect(modal.getByText('This job will process 1 image')).toBeVisible();
		await expect(modal.getByRole('listitem')).toContainText('d1v1');

		await modal.getByRole('button', { name: 'Cancel' }).click();
		const values2 = await getSlimSelectValues(page, page.getByLabel('Selector for attribute d1a1'));
		expect(values2).toHaveLength(1);
		expect(/** @type {string[]} */ (values2)[0]).toEqual('d1v1');

		await modal.getByRole('button', { name: 'Close' }).click();
		await waitModalClosed(page);
	});

	await test.step('Select the second dataset again', async () => {
		await page
			.getByRole('combobox', { name: 'Dataset', exact: true })
			.first()
			.selectOption(datasetName2);
	});

	await test.step('Check continue workflow modal', async () => {
		await page.getByRole('button', { name: 'Continue workflow' }).click();
		const modal = page.locator('.modal.show');
		await modal.waitFor();
		await modal.getByRole('combobox', { name: 'First task' }).selectOption('generic_task');

		// check images and selected filters
		await modal.getByRole('button', { name: 'Image list' }).click();
		const values = await getSlimSelectValues(page, page.getByLabel('Selector for attribute d2a1'));
		expect(values).toHaveLength(1);
		expect(/** @type {string[]} */ (values)[0]).toEqual('d2v2');

		await modal.getByRole('button', { name: 'Run', exact: true }).click();

		// Check filters on confimation page
		await expect(modal.getByText('This job will process 1 image')).toBeVisible();
		await expect(modal.getByRole('listitem')).toContainText('d2v2');

		await modal.getByRole('button', { name: 'Cancel' }).click();
		const values2 = await getSlimSelectValues(page, page.getByLabel('Selector for attribute d2a1'));
		expect(values2).toHaveLength(1);
		expect(/** @type {string[]} */ (values2)[0]).toEqual('d2v2');
	});
});
