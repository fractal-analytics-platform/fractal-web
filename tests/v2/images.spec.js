import { selectSlimSelect, waitModalClosed, waitPageLoading } from '../utils.js';
import { expect, test } from './project_fixture.js';

test('Dataset images [v2]', async ({ page, project }) => {
	await page.waitForURL(project.url);
	await waitPageLoading(page);

	const randomPath = `/tmp/${Math.random().toString(36).substring(7)}`;

	await test.step('Create test dataset', async () => {
		const createDatasetButton = page.getByRole('button', { name: 'Create new dataset' });
		await createDatasetButton.click();
		const modal = page.locator('.modal.show');
		await modal.waitFor();
		await modal.getByRole('textbox', { name: 'Dataset Name' }).fill('test-dataset');
		await modal.getByRole('textbox', { name: 'Zarr dir' }).fill(randomPath);
		await modal.getByRole('button', { name: 'Add attribute' }).click();
		await modal.getByPlaceholder('Key').fill('k1');
		await modal.getByPlaceholder('Value').fill('v1');
		await modal.getByRole('button', { name: 'Save' }).click();
		await waitModalClosed(page);
	});

	await test.step('Open test dataset', async () => {
		await page.getByRole('link', { name: 'test-dataset' }).click();
		await page.waitForURL(/\/v2\/projects\/\d+\/datasets\/\d+/);
		expect(await page.getByText('No entries in the image list yet').isVisible()).toEqual(true);
	});

	await test.step('Create an image without filters', async () => {
		await createImage(page, `${randomPath}/img1`, async function () {});
	});

	await test.step('Create an image with string attribute filter', async () => {
		await createImage(page, `${randomPath}/img2`, async function (modal) {
			await modal.getByRole('button', { name: 'Add attribute' }).click();
			await modal.getByPlaceholder('Key').fill('k1');
			await modal.getByPlaceholder('Value').fill('v1');
		});
	});

	await test.step('Create an image with numeric attribute filter', async () => {
		await createImage(page, `${randomPath}/img3`, async function (modal) {
			await modal.getByRole('button', { name: 'Add attribute' }).click();
			await modal.getByPlaceholder('Key').fill('k2');
			await modal.getByPlaceholder('Value').fill('42');
			await modal.getByRole('combobox').selectOption('Number');
		});
	});

	await test.step('Create an image with false type filter', async () => {
		await createImage(page, `${randomPath}/img4`, async function (modal) {
			await modal.getByRole('button', { name: 'Add type' }).click();
			await modal.getByPlaceholder('Key').fill('k3');
		});
	});

	await test.step('Create an image with true type filter', async () => {
		await createImage(page, `${randomPath}/img5`, async function (modal) {
			await modal.getByRole('button', { name: 'Add type' }).click();
			await modal.getByPlaceholder('Key').fill('k3');
			await modal.getByRole('switch').check();
		});
	});

	await test.step('Attempt to create an image with existing Zarr URL', async () => {
		await page.getByRole('button', { name: 'Add an image list entry' }).click();
		const modal = page.locator('.modal.show');
		await modal.waitFor();
		await modal.getByRole('textbox', { name: 'Zarr URL' }).fill(`${randomPath}/img1`);
		const saveBtn = modal.getByRole('button', { name: 'Save' });
		await saveBtn.click();
		await expect(modal.getByText(/Image with zarr_url '.*' already in Dataset/)).toBeVisible();
		await modal.getByRole('button', { name: 'Cancel' }).click();
		await waitModalClosed(page);
	});

	await test.step('Attempt to create an image with invalid Zarr URL', async () => {
		await page.getByRole('button', { name: 'Add an image list entry' }).click();
		const modal = page.locator('.modal.show');
		await modal.waitFor();
		await modal.getByRole('textbox', { name: 'Zarr URL' }).fill('foo');
		const saveBtn = modal.getByRole('button', { name: 'Save' });
		await saveBtn.click();
		await expect(modal.getByText(`URLs must begin with '/' or 's3'.`)).toBeVisible();
		await modal.getByRole('button', { name: 'Cancel' }).click();
		await waitModalClosed(page);
	});

	await test.step('Verify created images count', async () => {
		await expect(page.getByRole('row')).toHaveCount(7);
	});

	await test.step('Filter by string attribute', async () => {
		await selectSlimSelect(page, page.getByLabel('Selector for attribute k1'), 'v1');
		await searchImages(page, 1);
	});

	await test.step('Filter by numeric attribute', async () => {
		await selectSlimSelect(page, page.getByLabel('Selector for attribute k2'), '42');
		await searchImages(page, 1);
	});

	await test.step('Filter by false type', async () => {
		await selectSlimSelect(page, page.getByLabel('Selector for type k3'), 'False');
		await searchImages(page, 4);
	});

	await test.step('Filter by true type', async () => {
		await selectSlimSelect(page, page.getByLabel('Selector for type k3'), 'True');
		await searchImages(page, 1);
	});

	await test.step('Enable dataset filters', async () => {
		await expect(page.getByRole('row')).toHaveCount(7);
		const datasetFiltersBtn = page.getByText('Dataset filters').first();
		await expect(datasetFiltersBtn).toBeEnabled();
		await datasetFiltersBtn.click();
		await expect(datasetFiltersBtn).toBeEnabled();
		await expect(page.getByRole('row')).toHaveCount(3);
		const allImagesBtn = page.getByText('All images');
		await allImagesBtn.click();
		await expect(allImagesBtn).toBeEnabled();
		await expect(page.getByRole('row')).toHaveCount(7);
	});

	await test.step('Edit image', async () => {
		await page.getByRole('button', { name: 'Edit' }).nth(1).click();
		const modal = page.locator('.modal.show');
		await modal.waitFor();
		const zarrUrlInput = modal.getByRole('textbox', { name: 'Zarr URL' });
		await expect(zarrUrlInput).toHaveValue(`${randomPath}/img2`);
		await expect(zarrUrlInput).toBeDisabled();
		await expect(modal.getByPlaceholder('Key')).toHaveValue('k1');
		await expect(modal.getByPlaceholder('Value')).toHaveValue('v1');
		await modal.getByPlaceholder('Value').fill('v1-mod');
		await modal.getByRole('button', { name: 'Add attribute' }).click();
		await modal.getByPlaceholder('Key').nth(1).fill('k2');
		await modal.getByPlaceholder('Value').nth(1).fill('9999');
		await modal.getByRole('combobox').nth(1).selectOption('Number');
		await modal.getByRole('button', { name: 'Save' }).click();
		await waitModalClosed(page);
		await page.getByRole('cell', { name: 'v1-mod' }).waitFor();
		await page.getByRole('cell', { name: '9999' }).waitFor();
	});

	await test.step('Delete one image', async () => {
		await page.getByRole('button', { name: 'Delete' }).first().click();
		const modal = page.locator('.modal.show');
		await modal.waitFor();
		await page.getByRole('button', { name: 'Confirm' }).click();
		await expect(page.getByRole('row')).toHaveCount(6);
	});
});

/**
 * @param {import('@playwright/test').Page} page
 * @param {string} zarr_url
 * @param {(modal: import('@playwright/test').Locator) => Promise<void>} filtersFunction
 */
async function createImage(page, zarr_url, filtersFunction) {
	const newImageBtn = page.getByRole('button', { name: 'Add an image list entry' });
	await newImageBtn.waitFor();
	await newImageBtn.click();
	const modal = page.locator('.modal.show');
	await modal.waitFor();
	await modal.getByRole('textbox', { name: 'Zarr URL' }).fill(zarr_url);
	await filtersFunction(modal);
	await modal.getByRole('button', { name: 'Save' }).click();
	await waitModalClosed(page);
}

/**
 * @param {import('@playwright/test').Page} page
 * @param {number} expectedCount
 */
async function searchImages(page, expectedCount) {
	await expect(page.getByRole('row')).toHaveCount(7);
	const applyBtn = page.getByRole('button', { name: 'Apply' });
	await applyBtn.click();
	await expect(applyBtn).not.toBeEnabled();
	// wait spinner disappearing
	await expect(applyBtn.getByRole('status')).toHaveCount(0);
	await expect(page.getByRole('row')).toHaveCount(expectedCount + 2);
	const resetBtn = page.getByRole('button', { name: 'Reset', exact: true });
	await resetBtn.click();
	await expect(resetBtn).not.toBeEnabled();
	await expect(applyBtn).not.toBeEnabled();
	// wait spinner disappearing
	await expect(resetBtn.getByRole('status')).toHaveCount(0);
	await expect(page.getByRole('row')).toHaveCount(7);
}
