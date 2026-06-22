import { closeModal, waitModal, waitModalClosed, waitPageLoading } from '../../utils/utils.js';
import { expect, test } from '../project_fixture.js';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';
import os from 'os';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test('Create, update and delete a dataset [v2]', async ({ page, project }) => {
	await page.goto(project.url);
	await waitPageLoading(page);

	const initialDatasetsCount = await page.getByRole('table').first().getByRole('row').count();

	await test.step('Open "Create new dataset" modal', async () => {
		const createDatasetButton = page.getByRole('button', { name: 'Create new dataset' });
		await createDatasetButton.click();
		await waitDatasetModal(page, 'Create new dataset');
	});

	await test.step('Fill dataset mandatory values', async () => {
		await page.getByRole('textbox', { name: 'Dataset Name' }).fill('test-dataset');
		await page.getByRole('button', { name: 'Advanced options' }).click();
		await expect(page.getByRole('combobox', { name: 'Project directory' })).toHaveValue('/tmp');
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
			await expect(defaultDatasetRow.getByRole('cell').nth(0)).toHaveText('default');
		}
		datasetRow = datasetTable.getByRole('row').nth(initialDatasetsCount + 1);
		await expect(datasetRow.getByRole('cell').nth(0)).toHaveText('test-dataset');
	});

	await test.step('Filter dataset', async () => {
		const datasetTable = page.getByRole('table').nth(0).locator('tbody');
		await expect(datasetTable.getByRole('row')).toHaveCount(1);
		await page.getByPlaceholder('Search dataset').fill('foo');
		await expect(datasetTable.getByRole('row')).toHaveCount(0);
		await page.getByPlaceholder('Search dataset').fill('test-dataset');
		await expect(datasetTable.getByRole('row')).toHaveCount(1);
	});

	await test.step('Open dataset page', async () => {
		await datasetRow.getByRole('link', { name: 'test-dataset' }).click();
		await page.waitForURL(/\/v2\/projects\/\d+\/datasets\/\d+/);
	});

	await test.step('Open info modal', async () => {
		await page.getByRole('button', { name: 'Info' }).click();
		const modal = await waitModal(page);
		await expect(modal.getByText('test-dataset')).toBeVisible();
		await expect(modal.getByText('/tmp')).toBeVisible();
	});

	await test.step('Edit dataset name', async () => {
		const modal = await waitModal(page, false);
		await modal.getByRole('button', { name: 'Edit dataset name' }).click();
		await modal.getByRole('textbox').fill('test-dataset-renamed');
		await modal.getByRole('button', { name: 'Save' }).click();
		await expect(modal.getByRole('textbox')).toHaveCount(0);
		await closeModal(page);
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

		const modal = await waitModal(page, false);
		await expect(modal.locator('.modal-title')).toHaveText('Confirm action');
		await expect(modal.locator('.modal-body')).toContainText('Delete dataset test-dataset-renamed');

		// Confirm the deletion
		await page.getByRole('button', { name: 'Confirm' }).click();
		// Check table rows count
		await expect(page.getByText('This project currently has no dataset.')).toBeVisible();
	});

	await test.step('Attempt to import dataset without selecting a file', async () => {
		const createDatasetButton = page.getByRole('button', { name: 'Create new dataset' });
		await createDatasetButton.click();
		await waitDatasetModal(page, 'Create new dataset');
		await page.getByRole('radio', { name: 'Import from file' }).check();
		await page.getByRole('button', { name: 'Import' }).click();
		await page.getByText('A file is required').waitFor();
	});

	await test.step('Attempt to import dataset with invalid JSON', async () => {
		const fileChooserPromise = page.waitForEvent('filechooser');
		await page.getByText('Select dataset file').click();
		const fileChooser = await fileChooserPromise;
		await fileChooser.setFiles(path.join(__dirname, '..', '..', 'data', 'broken.json'));
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
		await page.getByRole('radio', { name: 'Import from file' }).check();
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

	await test.step('Star datasets', async () => {
		const name1 = 'test-dataset-renamed';
		const name2 = 'test-dataset-renamed2';

		let datasetTable = page.getByRole('table').nth(0);
		await verifyDatasetsCount(page, 2);

		// Initial state:
		// ds1 -> not starred
		// ds2 -> not starred
		let dataset1 = datasetTable.getByRole('row').nth(1).getByRole('cell').nth(0);
		let dataset2 = datasetTable.getByRole('row').nth(2).getByRole('cell').nth(0);

		await expect(dataset1).toHaveText(name1);
		await expect(dataset2).toHaveText(name2);

		let starButton1 = dataset1.getByRole('button', { name: 'star dataset' });
		let starIcon1 = starButton1.locator('i');
		let starButton2 = dataset2.getByRole('button', { name: 'star dataset' });
		let starIcon2 = starButton2.locator('i');

		await expect(starIcon1).toHaveClass(/bi-star(?!-fill)/);
		await expect(starIcon2).toHaveClass(/bi-star(?!-fill)/);

		// Star ds2 and reload page
		await starButton2.click();

		await expect(starIcon1).toHaveClass(/bi-star(?!-fill)/);
		await expect(starIcon2).toHaveClass(/bi-star-fill/);

		await page.reload();

		// After reload:
		// ds2 -> starred
		// ds1 -> not starred
		dataset1 = datasetTable.getByRole('row').nth(1).getByRole('cell').nth(0);
		dataset2 = datasetTable.getByRole('row').nth(2).getByRole('cell').nth(0);

		await expect(dataset1).toHaveText(name2);
		await expect(dataset2).toHaveText(name1);

		starIcon1 = dataset1.getByRole('button', { name: 'star dataset' }).locator('i');
		starIcon2 = dataset2.getByRole('button', { name: 'star dataset' }).locator('i');

		await expect(starIcon1).toHaveClass(/bi-star-fill/);
		await expect(starIcon2).toHaveClass(/bi-star(?!-fill)/);

		// Unstar ds2 and reload page
		await starButton1.click();

		await expect(starIcon1).toHaveClass(/bi-star(?!-fill)/);
		await expect(starIcon2).toHaveClass(/bi-star(?!-fill)/);

		await page.reload();

		// After reload:
		// ds1 -> not starred
		// ds2 -> not starred
		dataset1 = datasetTable.getByRole('row').nth(1).getByRole('cell').nth(0);
		dataset2 = datasetTable.getByRole('row').nth(2).getByRole('cell').nth(0);

		await expect(dataset1).toHaveText(name1);
		await expect(dataset2).toHaveText(name2);

		starIcon1 = dataset1.getByRole('button', { name: 'star dataset' }).locator('i');
		starIcon2 = dataset2.getByRole('button', { name: 'star dataset' }).locator('i');

		await expect(starIcon1).toHaveClass(/bi-star(?!-fill)/);
		await expect(starIcon2).toHaveClass(/bi-star(?!-fill)/);
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
	const modal = await waitModal(page, false);
	await expect(modal.locator('.modal-title')).toHaveText(title);
}
