import { expect, test } from './project_fixture.js';

test('Create, update and delete a dataset', async ({ page, project }) => {
	await page.waitForURL(project.url);

	const initialDatasetsCount = (await page.getByRole('table').first().getByRole('row').count()) - 1;

	const createDatasetButton = page.getByRole('button', { name: 'Create new dataset' });
	await createDatasetButton.click();
	await waitDatasetModal(page, 'Create new dataset');

	// Check dataset type options
	await page.waitForFunction(() => document.querySelectorAll('#datasetType option').length === 3);
	const datasetTypeOptions = await page.locator('#datasetType option').allTextContents();
	expect(datasetTypeOptions.length).toEqual(3);
	expect(datasetTypeOptions[0]).toEqual('Select...');
	expect(datasetTypeOptions[1]).toEqual('image');
	expect(datasetTypeOptions[2]).toEqual('zarr');

	// Fill dataset mandatory values
	await page.locator('#datasetName').fill('test-dataset');
	await page.selectOption('#datasetType', 'image');
	await page.locator('#resource-path-0').fill('/tmp/folder1');

	// Add resource
	const addResourceBtn = page.getByRole('button', { name: 'Add resource' });
	await addResourceBtn.click();
	await page.locator('#resource-path-1').fill('/tmp/folder2');

	// Save dataset
	let saveBtn = page.getByRole('button', { name: 'Save' });
	await saveBtn.click();

	// Verify dataset table content
	let datasetTable = page.getByRole('table').nth(0);
	await verifyDatasetsCount(page, initialDatasetsCount + 1);
	if (initialDatasetsCount === 1) {
		let defaultDatasetRow = datasetTable.getByRole('row').nth(1);
		expect(await defaultDatasetRow.getByRole('cell').nth(0).innerText()).toEqual('default');
	}
	let datasetRow = datasetTable.getByRole('row').nth(initialDatasetsCount + 1);
	expect(await datasetRow.getByRole('cell').nth(0).innerText()).toEqual('test-dataset');
	expect(await datasetRow.getByRole('cell').nth(1).innerText()).toEqual('image');

	// Edit dataset
	await datasetRow.getByRole('button', { name: 'Edit' }).click();
	await waitDatasetModal(page, 'Edit dataset test-dataset');

	// Verify the content
	expect(await page.locator('#datasetName').inputValue()).toEqual('test-dataset');
	expect(await page.locator('#datasetType').inputValue()).toEqual('image');
	expect(await page.locator('#resource-path-0').inputValue()).toEqual('/tmp/folder1');
	expect(await page.locator('#resource-path-1').inputValue()).toEqual('/tmp/folder2');

	// Edit mandatory values
	await page.locator('#datasetName').fill('test-dataset-renamed');
	await page.getByLabel('custom').check();
	await page.locator('#customDatasetType').fill('custom-type');
	await page.locator('#readonly').check();

	// Rename resource 1
	await page.locator('#save-resource-0').click();
	await page.locator('#resource-path-0').fill('/tmp/folder1-renamed');
	await page.locator('#save-resource-0').click();

	// Delete resource 2
	await page.locator('#remove-resource-1').click();
	saveBtn = page.getByRole('button', { name: 'Save' });
	await saveBtn.click();

	// Verify updated dataset table content
	datasetTable = page.getByRole('table').nth(0);
	datasetRow = datasetTable.getByRole('row').nth(initialDatasetsCount + 1);
	expect(await datasetRow.getByRole('cell').nth(0).innerText()).toEqual('test-dataset-renamed');
	expect(await datasetRow.getByRole('cell').nth(1).innerText()).toEqual('custom-type');

	// Open delete dataset modal
	await datasetRow.getByRole('button', { name: 'Delete' }).click();

	const modalTitle = page.locator('.modal.show .modal-title');
	await modalTitle.waitFor();
	await expect(modalTitle).toHaveText('Confirm action');
	await expect(page.locator('.modal.show .modal-body')).toContainText(
		'Delete dataset test-dataset-renamed'
	);

	// Confirm the deletion
	await page.getByRole('button', { name: 'Confirm' }).click();

	// Check table rows count
	datasetTable = page.getByRole('table').nth(0);
	await verifyDatasetsCount(page, initialDatasetsCount);
});

/**
 * @param {import('@playwright/test').Page} page
 * @param {number} expectedCount
 */
async function verifyDatasetsCount(page, expectedCount) {
	await page.waitForFunction(
		(expectedCount) =>
			document.querySelectorAll('tbody')[0].querySelectorAll('tr').length === expectedCount,
		expectedCount
	);
}

/**
 * @param {import('@playwright/test').Page} page
 * @param {string} title
 */
async function waitDatasetModal(page, title) {
	const modalTitle = page.locator('.modal.show .modal-title');
	await modalTitle.waitFor();
	await expect(modalTitle).toHaveText(title);
}
