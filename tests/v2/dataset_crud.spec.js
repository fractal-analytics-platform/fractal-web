import { waitModalClosed, waitPageLoading } from '../utils.js';
import { expect, test } from './project_fixture.js';

test('Create, update and delete a dataset [v2]', async ({ page, project }) => {
	await page.waitForURL(project.url);
	await waitPageLoading(page);

	const initialDatasetsCount = (await page.getByRole('table').first().getByRole('row').count()) - 1;

	await test.step('Open "Create new dataset" modal', async () => {
		const createDatasetButton = page.getByRole('button', { name: 'Create new dataset' });
		await createDatasetButton.click();
		await waitDatasetModal(page, 'Create new dataset');
	});

	await test.step('Fill dataset mandatory values', async () => {
		await page.getByRole('textbox', { name: 'Dataset Name' }).fill('test-dataset');
		await page.getByRole('textbox', { name: 'Zarr dir' }).fill('/tmp');
	});

	await test.step('Add filter', async () => {
		const addFilterBtn = page.getByRole('button', { name: 'Add filter' });
		await addFilterBtn.click();
		await page.getByPlaceholder('Key').fill('key1');
		await page.getByPlaceholder('Value').fill('value1');
	});

	await test.step('Save dataset', async () => {
		let saveBtn = page.getByRole('button', { name: 'Save' });
		await saveBtn.click();
		await waitModalClosed(page);
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
	});

	await test.step('Open dataset for editing and verify the saved content', async () => {
		await datasetRow.getByRole('button', { name: 'Edit' }).click();
		await waitDatasetModal(page, 'Edit dataset test-dataset');
		expect(await page.getByRole('textbox', { name: 'Dataset Name' }).inputValue()).toEqual(
			'test-dataset'
		);
		expect(await page.getByRole('textbox', { name: 'Zarr dir' }).inputValue()).toEqual('/tmp');
		expect(await page.getByPlaceholder('Key').inputValue()).toEqual('key1');
		expect(await page.getByPlaceholder('Value').inputValue()).toEqual('value1');
	});

	await test.step('Edit dataset', async () => {
		await page.getByRole('textbox', { name: 'Dataset Name' }).fill('test-dataset-renamed');
		await page.getByRole('textbox', { name: 'Zarr dir' }).fill('/tmp-renamed');
		await page.getByPlaceholder('Key').fill('key1-renamed');
		await page.getByPlaceholder('Value').fill('value1-renamed');
	});

	await test.step('Save dataset', async () => {
		let saveBtn = page.getByRole('button', { name: 'Save' });
		await saveBtn.click();
		await waitModalClosed(page);
	});

	await test.step('Filter dataset', async () => {
		const datasetTable = page.getByRole('table').nth(0).locator('tbody');
		expect(await datasetTable.getByRole('row').count()).toEqual(1);
		await page.getByPlaceholder('Search dataset').fill('foo');
		expect(await datasetTable.getByRole('row').count()).toEqual(0);
		await page.getByPlaceholder('Search dataset').fill('test-dataset-renamed');
		expect(await datasetTable.getByRole('row').count()).toEqual(1);
	});

	await test.step('Open dataset page', async () => {
		await datasetRow.getByRole('link', { name: 'Open' }).click();
		await page.waitForURL(/\/v2\/projects\/\d+\/datasets\/\d+/);
		const properties = page.locator('.list-group');
		await expect(properties.getByText('test-dataset-renamed')).toBeVisible();
		await expect(properties.getByText('/tmp-renamed')).toBeVisible();
		const filters = page.getByRole('table');
		await expect(filters.getByText('key1-renamed')).toBeVisible();
		await expect(filters.getByText('value1-renamed')).toBeVisible();
	});

	await test.step('Go back to datasets page', async () => {
		await page.goBack();
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
