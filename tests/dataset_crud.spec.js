import { waitPageLoading } from './utils.js';
import { expect, test } from './project_fixture.js';

test('Create, update and delete a dataset', async ({ page, project }) => {
	await page.waitForURL(project.url);
	await waitPageLoading(page);

	const initialDatasetsCount = (await page.getByRole('table').first().getByRole('row').count()) - 1;

	await test.step('Open "Create new dataset" modal', async () => {
		const createDatasetButton = page.getByRole('button', { name: 'Create new dataset' });
		await createDatasetButton.click();
		await waitDatasetModal(page, 'Create new dataset');
	});

	await test.step('Check dataset type options', async () => {
		await page.waitForFunction(() => document.querySelectorAll('#datasetType option').length === 3);
		const datasetTypeOptions = await page.locator('#datasetType option').allTextContents();
		expect(datasetTypeOptions.length).toEqual(3);
		expect(datasetTypeOptions[0]).toEqual('Select...');
		expect(datasetTypeOptions[1]).toEqual('image');
		expect(datasetTypeOptions[2]).toEqual('zarr');
	});

	await test.step('Fill dataset mandatory values', async () => {
		await page.locator('#datasetName').fill('test-dataset');
		await page.selectOption('#datasetType', 'image');
		await page.locator('#resource-path-0').fill('/tmp/folder1');
	});

	await test.step('Add resource', async () => {
		const addResourceBtn = page.getByRole('button', { name: 'Add resource' });
		await addResourceBtn.click();
		await page.locator('#resource-path-1').fill('/tmp/folder2');
	});

	await test.step('Save dataset', async () => {
		let saveBtn = page.getByRole('button', { name: 'Save' });
		await saveBtn.click();
	});

	/** @type {import('@playwright/test').Locator} */
	let datasetRow;
	await test.step('Verify dataset table content', async () => {
		let datasetTable = page.getByRole('table').nth(0);
		await verifyDatasetsCount(page, initialDatasetsCount + 1);
		if (initialDatasetsCount === 1) {
			let defaultDatasetRow = datasetTable.getByRole('row').nth(1);
			expect(await defaultDatasetRow.getByRole('cell').nth(0).innerText()).toEqual('default');
		}
		datasetRow = datasetTable.getByRole('row').nth(initialDatasetsCount + 1);
		expect(await datasetRow.getByRole('cell').nth(0).innerText()).toEqual('test-dataset');
		expect(await datasetRow.getByRole('cell').nth(1).innerText()).toEqual('image');
	});

	await test.step('Edit dataset', async () => {
		await datasetRow.getByRole('button', { name: 'Edit' }).click();
		await waitDatasetModal(page, 'Edit dataset test-dataset');
		// Verify the content
		expect(await page.locator('#datasetName').inputValue()).toEqual('test-dataset');
		expect(await page.locator('#datasetType').inputValue()).toEqual('image');
		expect(await page.locator('#resource-path-0').inputValue()).toEqual('/tmp/folder1');
		expect(await page.locator('#resource-path-1').inputValue()).toEqual('/tmp/folder2');
	});

	await test.step('Edit mandatory values', async () => {
		await page.locator('#datasetName').fill('test-dataset-renamed');
		await page.getByLabel('custom').check();
		await page.locator('#customDatasetType').fill('custom-type');
		await page.locator('#readonly').check();
	});

	await test.step('Rename resource 1', async () => {
		await page.locator('#save-resource-0').click();
		await page.locator('#resource-path-0').fill('/tmp/folder1-renamed');
		await page.locator('#save-resource-0').click();
	});

	await test.step('Delete resource 2', async () => {
		await page.locator('#remove-resource-1').click();
		const saveBtn = page.getByRole('button', { name: 'Save' });
		await saveBtn.click();
		// Verify updated dataset table content
		const datasetTable = page.getByRole('table').nth(0);
		datasetRow = datasetTable.getByRole('row').nth(initialDatasetsCount + 1);
		expect(await datasetRow.getByRole('cell').nth(0).innerText()).toEqual('test-dataset-renamed');
		expect(await datasetRow.getByRole('cell').nth(1).innerText()).toEqual('custom-type');
	});

	await test.step('Filter dataset', async () => {
		const datasetTable = page.getByRole('table').nth(0).locator('tbody');
		expect(await datasetTable.getByRole('row').count()).toEqual(1);
		await page.getByPlaceholder('Search dataset').fill('foo');
		expect(await datasetTable.getByRole('row').count()).toEqual(0);
		await page.getByPlaceholder('Search dataset').fill('test-dataset');
		expect(await datasetTable.getByRole('row').count()).toEqual(1);
	});

	await test.step('Delete dataset', async () => {
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
		await verifyDatasetsCount(page, initialDatasetsCount);
	});
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
