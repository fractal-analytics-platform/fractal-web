import { waitModalClosed, waitPageLoading } from '../utils.js';
import { expect, test } from './project_fixture.js';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';
import os from 'os';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
		await page.getByRole('button', { name: 'Advanced options' }).click();
		await page.getByRole('textbox', { name: 'Zarr dir' }).fill('/tmp');
	});

	await test.step('Save dataset', async () => {
		const saveBtn = page.getByRole('button', { name: 'Save' });
		await saveBtn.click();
		await waitModalClosed(page);
		await expect(page.getByText(/Created new dataset with Zarr dir \/tmp/)).toBeVisible();
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

	await test.step('Filter dataset', async () => {
		const datasetTable = page.getByRole('table').nth(0).locator('tbody');
		expect(await datasetTable.getByRole('row').count()).toEqual(1);
		await page.getByPlaceholder('Search dataset').fill('foo');
		expect(await datasetTable.getByRole('row').count()).toEqual(0);
		await page.getByPlaceholder('Search dataset').fill('test-dataset');
		expect(await datasetTable.getByRole('row').count()).toEqual(1);
	});

	await test.step('Open dataset page', async () => {
		await datasetRow.getByRole('link', { name: 'test-dataset' }).click();
		await page.waitForURL(/\/v2\/projects\/\d+\/datasets\/\d+/);
	});

	await test.step('Open info modal', async () => {
		await page.getByRole('button', { name: 'Info' }).click();
		const modal = page.locator('.modal.show');
		await modal.waitFor();
		await expect(modal.getByText('test-dataset')).toBeVisible();
		await expect(modal.getByText('/tmp')).toBeVisible();
	});

	await test.step('Edit dataset name', async () => {
		const modal = page.locator('.modal.show');
		await modal.getByRole('button', { name: 'Edit dataset name' }).click();
		await modal.getByRole('textbox').fill('test-dataset-renamed');
		await modal.getByRole('button', { name: 'Save' }).click();
		await expect(modal.getByRole('textbox')).toHaveCount(0);
	});

	await test.step('Edit Zarr dir', async () => {
		const modal = page.locator('.modal.show');
		await modal.getByRole('button', { name: 'Edit Zarr dir' }).click();
		await modal.getByRole('textbox').fill('/tmp-renamed');
		await modal.getByRole('button', { name: 'Save' }).click();
		await expect(modal.getByRole('textbox')).toHaveCount(0);
	});

	await test.step('Attempt to set invalid Zarr dir', async () => {
		const modal = page.locator('.modal.show');
		await modal.getByRole('button', { name: 'Edit Zarr dir' }).click();
		await modal.getByRole('textbox').fill('foo');
		await modal.getByRole('button', { name: 'Save' }).click();
		await expect(modal.getByText(`URLs must begin with '/' or 's3'.`)).toBeVisible();
		await expect(modal.getByRole('textbox')).toHaveCount(1);
		await modal.getByRole('button', { name: 'Undo edit zarr dir' }).click();
		await expect(modal.getByRole('textbox')).toHaveCount(0);
	});

	await test.step('Close info modal', async () => {
		await page.locator('.modal.show').getByLabel('Close').click();
		await waitModalClosed(page);
	});

	let exportedDatasetFile;
	await test.step('Export dataset', async () => {
		const downloadPromise = page.waitForEvent('download');
		await page.getByLabel('Export dataset').click();
		const download = await downloadPromise;
		exportedDatasetFile = path.join(os.tmpdir(), download.suggestedFilename());
		await download.saveAs(exportedDatasetFile);
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

	await test.step('Attempt to import dataset without selecting a file', async () => {
		const createDatasetButton = page.getByRole('button', { name: 'Create new dataset' });
		await createDatasetButton.click();
		await waitDatasetModal(page, 'Create new dataset');
		await page.getByText('Import from file').click();
		await page.getByRole('button', { name: 'Import' }).click();
		await page.getByText('A file is required').waitFor();
	});

	await test.step('Attempt to import dataset with invalid JSON', async () => {
		const fileChooserPromise = page.waitForEvent('filechooser');
		await page.getByText('Select dataset file').click();
		const fileChooser = await fileChooserPromise;
		await fileChooser.setFiles(path.join(__dirname, '..', 'data', 'broken.json'));
		await page.getByRole('button', { name: 'Import' }).click();
		await page.getByText('The selected file is not a valid JSON file').waitFor();
	});

	await test.step('Import exported dataset', async () => {
		const fileChooserPromise = page.waitForEvent('filechooser');
		await page.getByText('Select dataset file').click();
		const fileChooser = await fileChooserPromise;
		await fileChooser.setFiles(exportedDatasetFile);
		await page.getByRole('button', { name: 'Import' }).click();
		await waitModalClosed(page);
		await verifyDatasetsCount(page, initialDatasetsCount + 1);
		await page.getByRole('cell', { name: 'test-dataset-renamed' }).waitFor();
	});

	await test.step('Import exported dataset with renaming', async () => {
		const createDatasetButton = page.getByRole('button', { name: 'Create new dataset' });
		await createDatasetButton.click();
		await waitDatasetModal(page, 'Create new dataset');
		await page.getByText('Import from file').click();
		await page.getByRole('textbox', { name: 'Dataset Name' }).fill('test-dataset-renamed2');
		const fileChooserPromise = page.waitForEvent('filechooser');
		await page.getByText('Select dataset file').click();
		const fileChooser = await fileChooserPromise;
		await fileChooser.setFiles(exportedDatasetFile);
		await page.getByRole('button', { name: 'Import' }).click();
		await waitModalClosed(page);
		await verifyDatasetsCount(page, initialDatasetsCount + 2);
		await page.getByRole('cell', { name: 'test-dataset-renamed2' }).waitFor();
	});

	await test.step('Cleanup', async () => {
		fs.rmSync(exportedDatasetFile);
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
