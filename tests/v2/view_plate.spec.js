import { waitModalClosed, waitPageLoading } from '../utils.js';
import { expect, test } from './project_fixture.js';

test('View plate and feature explorer link', async ({ page, project }) => {
	await page.waitForURL(project.url);
	await waitPageLoading(page);

	const randomZarrSubfolder = Math.random().toString(36).substring(7);
	const randomPath = `/tmp/${randomZarrSubfolder}`;

	await test.step('Create test dataset', async () => {
		const createDatasetButton = page.getByRole('button', { name: 'Create new dataset' });
		await createDatasetButton.click();
		const modal = page.locator('.modal.show');
		await modal.waitFor();
		await modal.getByRole('textbox', { name: 'Dataset Name' }).fill('test-dataset');
		await modal.getByRole('button', { name: 'Advanced options' }).click();
		await modal.getByRole('combobox', { name: 'Project dir' }).selectOption('/tmp');
		await modal.getByRole('textbox', { name: 'Zarr subfolder' }).fill(randomZarrSubfolder);
		await modal.getByRole('button', { name: 'Save' }).click();
		await waitModalClosed(page);
	});

	await test.step('Open test dataset', async () => {
		await page.getByRole('link', { name: 'test-dataset' }).click();
		await page.waitForURL(/\/v2\/projects\/\d+\/datasets\/\d+/);
		await expect(page.getByText('No entries in the image list yet')).toBeVisible();
	});

	await test.step('Create test images', async () => {
		for (let i = 0; i < 5; i++) {
			await createImageWithPlate(page, `${randomPath}/plate1.zarr/B/03/${i}`, 'plate1');
		}
		for (let i = 5; i < 11; i++) {
			await createImageWithPlate(page, `${randomPath}/plate2.zarr/B/03/${i}`, 'plate2');
		}
		await createImageWithPlate(page, `${randomPath}/plate3.zarr/B/03/11`, 'plate3');
	});

	await test.step('Check plate selector', async () => {
		await checkPlateSelector(page, 'plate1', 'plate2', 'plate3');
	});

	await test.step('Select plates', async () => {
		for (let i = 1; i <= 3; i++) {
			await page.getByRole('combobox', { name: 'Select plate' }).selectOption(`plate${i}`);
			const plateUrlRegExp = new RegExp(`\\/plate${i}\\.zarr$`);
			await expect(page.getByRole('link', { name: 'View plate' })).toHaveAttribute(
				'href',
				plateUrlRegExp
			);
			await expect(page.getByRole('link', { name: 'Open in Feature Explorer' })).toHaveAttribute(
				'href',
				new RegExp(`\\/plate${i}\\.zarr\\&setup_mode=Plates$`)
			);
			await page.getByRole('button', { name: 'Get URL' }).first().click();
			const clipboardContent = await page.evaluate(async () => {
				return await navigator.clipboard.readText();
			});
			expect(clipboardContent).toMatch(plateUrlRegExp);
			await expect(page.getByRole('combobox', { name: 'Select plate' })).toHaveValue(`plate${i}`);
		}
	});

	await test.step('Delete image with plate3 and check selection', async () => {
		// go to page 2
		await page.getByRole('button', { name: '2', exact: true }).click();
		await page
			.getByRole('row', { name: 'plate3.zarr' })
			.getByRole('button', { name: 'Delete' })
			.click();
		const modal = page.locator('.modal.show');
		await modal.waitFor();
		await modal.getByRole('button', { name: 'Confirm' }).click();
		await waitModalClosed(page);
		await expect(page.getByRole('combobox', { name: 'Select plate' })).toHaveValue('');
	});

	await test.step('Check plate selector', async () => {
		await checkPlateSelector(page, 'plate1', 'plate2');
	});

	await test.step('Create another test dataset with invalid zarr dir', async () => {
		await page.getByRole('link', { name: project.projectName }).click();
		await waitPageLoading(page);
		const createDatasetButton = page.getByRole('button', { name: 'Create new dataset' });
		await createDatasetButton.click();
		const modal = page.locator('.modal.show');
		await modal.waitFor();
		await modal.getByRole('textbox', { name: 'Dataset Name' }).fill('test-dataset-2');
		await modal.getByRole('button', { name: 'Advanced options' }).click();
		await modal.getByRole('combobox', { name: 'Project dir' }).selectOption('/tmp');
		await modal.getByRole('textbox', { name: 'Zarr subfolder' }).fill('invalid');
		await modal.getByRole('button', { name: 'Save' }).click();
		await waitModalClosed(page);
	});

	await test.step('Open test dataset 2 and create new image', async () => {
		await page.getByRole('link', { name: 'test-dataset-2' }).click();
		await page.waitForURL(/\/v2\/projects\/\d+\/datasets\/\d+/);
		await expect(page.getByText('No entries in the image list yet')).toBeVisible();
		await createImageWithPlate(page, '/tmp/invalid/foo', 'plate1');
		await checkPlateSelector(page, 'plate1');
		await page.getByRole('combobox', { name: 'Select plate' }).selectOption('plate1');
		await expect(
			page.getByText('Unable to load plate URL from zarr URL /tmp/invalid')
		).toBeVisible();
	});
});

/**
 * @param {import('@playwright/test').Page} page
 * @param {string} zarrUrl
 * @param {string} plate
 */
async function createImageWithPlate(page, zarrUrl, plate) {
	const newImageBtn = page.getByRole('button', { name: 'Add an image list entry' });
	await newImageBtn.waitFor();
	await newImageBtn.click();
	const modal = page.locator('.modal.show');
	await modal.waitFor();
	await modal.getByRole('textbox', { name: 'Zarr URL' }).fill(zarrUrl);
	await modal.getByRole('button', { name: 'Add attribute' }).click();
	await modal.getByPlaceholder('Key').fill('plate');
	await modal.getByPlaceholder('Value').fill(plate);
	await modal.getByRole('button', { name: 'Save' }).click();
	await waitModalClosed(page);
}

/**
 * @param {import('@playwright/test').Page} page
 * @param  {...string} expectedOptions
 */
async function checkPlateSelector(page, ...expectedOptions) {
	await expect(
		page.getByText(`This dataset contains ${expectedOptions.length} plate`)
	).toBeVisible();
	const options = await page
		.getByRole('combobox', { name: 'Select plate' })
		.getByRole('option')
		.all();
	expect(options).toHaveLength(expectedOptions.length + 1);
	expect(options[0]).toHaveText('Select...');
	for (let i = 0; i < expectedOptions.length; i++) {
		expect(options[i + 1]).toHaveText(expectedOptions[i]);
	}
}
