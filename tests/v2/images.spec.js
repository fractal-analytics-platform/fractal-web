import { waitModalClosed, waitPageLoading } from '../utils.js';
import { expect, test } from './project_fixture.js';

test('Dataset images [v2]', async ({ page, project }) => {
	await page.waitForURL(project.url);
	await waitPageLoading(page);

	await test.step('Create test dataset', async () => {
		const createDatasetButton = page.getByRole('button', { name: 'Create new dataset' });
		await createDatasetButton.click();
		const modal = page.locator('.modal.show');
		await modal.waitFor();
		await modal.getByRole('textbox', { name: 'Dataset Name' }).fill('test-dataset');
		await modal.getByRole('textbox', { name: 'Zarr dir' }).fill('/tmp');
		await modal.getByRole('button', { name: 'Add attribute filter' }).click();
		await modal.getByPlaceholder('Key').fill('k1');
		await modal.getByPlaceholder('Value').fill('v1');
		await modal.getByRole('button', { name: 'Save' }).click();
		await waitModalClosed(page);
	});

	await test.step('Open test dataset', async () => {
		await page.getByRole('link', { name: 'Open' }).click();
		await page.waitForURL(/\/v2\/projects\/\d+\/datasets\/\d+/);
		expect(await page.getByText('No entries in the image list yet').isVisible()).toEqual(true);
	});

	await test.step('Create an image without filters', async () => {
		await createImage(page, 'img1', async function () {});
	});

	await test.step('Create an image with string attribute filter', async () => {
		await createImage(page, 'img2', async function (modal) {
			await modal.getByRole('button', { name: 'Add attribute filter' }).click();
			await modal.getByPlaceholder('Key').fill('k1');
			await modal.getByPlaceholder('Value').fill('v1');
		});
	});

	await test.step('Create an image with numeric attribute filter', async () => {
		await createImage(page, 'img3', async function (modal) {
			await modal.getByRole('button', { name: 'Add attribute filter' }).click();
			await modal.getByPlaceholder('Key').fill('k2');
			await modal.getByPlaceholder('Value').fill('42');
			await modal.getByRole('combobox').selectOption('Number');
		});
	});

	await test.step('Create an image with false type filter', async () => {
		await createImage(page, 'img4', async function (modal) {
			await modal.getByRole('button', { name: 'Add type filter' }).click();
			await modal.getByPlaceholder('Key').fill('k3');
		});
	});

	await test.step('Create an image with true type filter', async () => {
		await createImage(page, 'img5', async function (modal) {
			await modal.getByRole('button', { name: 'Add type filter' }).click();
			await modal.getByPlaceholder('Key').fill('k3');
			await modal.getByRole('checkbox').check();
		});
	});

	await test.step('Attempt to create an image with existing path', async () => {
		await page.getByRole('button', { name: 'Add an image list entry' }).click();
		const modal = page.locator('.modal.show');
		await modal.waitFor();
		await modal.getByRole('textbox', { name: 'Path' }).fill('/tmp/img1');
		const saveBtn = modal.getByRole('button', { name: 'Save' });
		await saveBtn.click();
		await modal.getByText('There has been an error').waitFor();
		await modal.getByRole('button', { name: 'Cancel' }).click();
		await waitModalClosed(page);
	});

	await test.step('Verify created images count', async () => {
		await expect(page.getByRole('row')).toHaveCount(6);
	});

	await test.step('Filter by path', async () => {
		await page.getByRole('textbox', { name: 'Path' }).first().fill('/tmp/img1');
		await searchImages(page, 1);
	});

	await test.step('Filter by string attribute', async () => {
		await page.getByRole('combobox', { name: 'k1' }).selectOption('v1');
		await searchImages(page, 1);
	});

	await test.step('Filter by numeric attribute', async () => {
		await page.getByRole('combobox', { name: 'k2' }).selectOption('42');
		await searchImages(page, 1);
	});

	await test.step('Filter by false type', async () => {
		await page.getByRole('combobox', { name: 'k3' }).selectOption('False');
		await searchImages(page, 4);
	});

	await test.step('Filter by true type', async () => {
		await page.getByRole('combobox', { name: 'k3' }).selectOption('True');
		await searchImages(page, 1);
	});

	await test.step('Enable dataset filters', async () => {
		expect(await page.getByRole('row').count()).toEqual(6);
		const searchImagesBtn = page.getByRole('button', { name: 'Search images' });
		await page.getByText('Dataset filters').first().click();
		await expect(searchImagesBtn).toBeEnabled();
		await expect(page.getByRole('row')).toHaveCount(2);
		await page.getByText('All images').click();
		await expect(searchImagesBtn).toBeEnabled();
		await expect(page.getByRole('row')).toHaveCount(6);
	});

	await test.step('Delete one image', async () => {
		await page.getByRole('button', { name: 'Delete' }).first().click();
		const modal = page.locator('.modal.show');
		await modal.waitFor();
		await page.getByRole('button', { name: 'Confirm' }).click();
		await expect(page.getByRole('button', { name: 'Search images' })).toBeEnabled();
		await expect(page.getByRole('row')).toHaveCount(5);
	});
});

/**
 * @param {import('@playwright/test').Page} page
 * @param {string} path
 * @param {(modal: import('@playwright/test').Locator) => Promise<void>} filtersFunction
 */
async function createImage(page, path, filtersFunction) {
	await page.getByRole('button', { name: 'Add an image list entry' }).click();
	const modal = page.locator('.modal.show');
	await modal.waitFor();
	await modal.getByRole('textbox', { name: 'Path' }).fill('/tmp/' + path);
	await filtersFunction(modal);
	await modal.getByRole('button', { name: 'Save' }).click();
	await waitModalClosed(page);
}

/**
 * @param {import('@playwright/test').Page} page
 * @param {number} expectedCount
 */
async function searchImages(page, expectedCount) {
	const searchImagesBtn = page.getByRole('button', { name: 'Search images' });
	await searchImagesBtn.click();
	await expect(searchImagesBtn).toBeEnabled();
	await expect(page.getByRole('row')).toHaveCount(expectedCount + 1);
	const resetBtn = page.getByRole('button', { name: 'Reset' });
	await resetBtn.click();
	await expect(searchImagesBtn).toBeEnabled();
}
