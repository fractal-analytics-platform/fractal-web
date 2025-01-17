import { expect, test } from './workflow_fixture.js';
import { getSlimSelectValues, selectSlimSelect, waitPageLoading } from '../utils.js';
import { createImage } from './image_utils.js';
import { createDataset } from './dataset_utils.js';

test('Run workflow implicit applies changed filters [#694]', async ({ page, workflow }) => {
	await page.waitForURL(workflow.url);
	await waitPageLoading(page);

	let datasetName;
	await test.step('Create test dataset1 and open dataset page', async () => {
		const { name } = await createDataset(page, workflow.projectId);
		datasetName = name;
		await page.getByRole('link', { name: datasetName }).click();
		await waitPageLoading(page);
	});

	await test.step('Create test images for dataset1', async () => {
		await createImage(page, `/tmp/playwright/datasets/${datasetName}/img1`, { a1: 'v1' });
		await createImage(page, `/tmp/playwright/datasets/${datasetName}/img2`, { a1: 'v2' });
	});

	await test.step('Create filters for dataset1', async () => {
		await page.getByText('Dataset filters').click();
		await selectSlimSelect(page, page.getByLabel('Selector for attribute a1'), 'v1');
		await page.getByRole('button', { name: 'Apply' }).click();
		await page.getByRole('button', { name: 'Save filters' }).click();
		await expect(page.getByRole('button', { name: 'Save filters' })).toBeDisabled();
	});

	const modal = page.locator('.modal.show');

	await test.step('Open "Run workflow" modal', async () => {
		await page.goto(workflow.url);
		await waitPageLoading(page);
		await workflow.addTask('generic_task');
		await page.getByRole('button', { name: 'Run workflow' }).click();
		await modal.waitFor();

		// check images and selected filters
		await modal.getByRole('button', { name: 'Image list' }).click();
		const values = await getSlimSelectValues(page, page.getByLabel('Selector for attribute a1'));
		expect(values).toHaveLength(1);
		expect(/** @type {string[]} */ (values)[0]).toEqual('v1');
	});

	await test.step('Add another filter and click on Run without clicking Apply', async () => {
		await selectSlimSelect(page, page.getByLabel('Selector for attribute a1'), 'v2', true);
		await expect(modal.getByRole('button', { name: 'Apply' })).toBeEnabled();
		await modal.getByRole('button', { name: 'Run', exact: true }).click();
	});

	await test.step('Check filters have been applied in any case', async () => {
		await expect(modal.getByText('This job will process 2 images')).toBeVisible();
		await expect(modal.getByRole('listitem')).toContainText('v1');
		await expect(modal.getByRole('listitem')).toContainText('v2');
	});

	await test.step('Click cancel and check that filters have been reset', async () => {
		await modal.getByRole('button', { name: 'Cancel' }).click();
		const values = await getSlimSelectValues(page, page.getByLabel('Selector for attribute a1'));
		expect(values).toHaveLength(1);
		expect(/** @type {string[]} */ (values)[0]).toEqual('v1');
		await expect(modal.getByRole('button', { name: 'Apply' })).toBeDisabled();
	});

	await test.step('Click Run and check', async () => {
		await modal.getByRole('button', { name: 'Run', exact: true }).click();
		await expect(modal.getByText('This job will process 1 image')).toBeVisible();
		await expect(modal.getByRole('listitem')).toContainText('v1');
		await expect(modal.getByRole('listitem')).not.toContainText('v2');
	});
});
