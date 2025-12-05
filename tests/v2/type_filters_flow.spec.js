import { waitModalClosed, waitPageLoading } from '../utils.js';
import { createImage } from './image_utils.js';
import { expect, test } from './workflow_fixture.js';

test('Type filters flow modal', async ({ page, workflow }) => {
	await page.waitForURL(workflow.url);
	await waitPageLoading(page);

	await page.goto(`/v2/projects/${workflow.projectId}`);
	await waitPageLoading(page);

	const randomZarrSubfolder = Math.random().toString(36).substring(7);
	const randomPath = `/tmp/${randomZarrSubfolder}`;
	const modal = page.locator('.modal.show');

	await test.step('Create test dataset', async () => {
		const createDatasetButton = page.getByRole('button', { name: 'Create new dataset' });
		await createDatasetButton.click();
		await modal.waitFor();
		await modal.getByRole('textbox', { name: 'Dataset Name' }).fill('test-dataset');
		await modal.getByRole('button', { name: 'Advanced options' }).click();
		await modal.getByRole('combobox', { name: 'Project dir' }).selectOption('/tmp');
		await modal.getByRole('textbox', { name: 'Zarr subfolder' }).fill(randomZarrSubfolder);
		await modal.getByRole('button', { name: 'Save' }).click();
		await waitModalClosed(page);
	});

	await test.step('Add images', async () => {
		await page.getByRole('link', { name: 'test-dataset' }).click();
		await waitPageLoading(page);
		await createImage(page, `${randomPath}/img1`, {}, { t1: true });
		await createImage(page, `${randomPath}/img2`, {}, { t1: false });
	});

	await test.step('Open workflow page', async () => {
		await page.goto(workflow.url);
		await waitPageLoading(page);
		await workflow.addTask('cellpose_segmentation');
		await workflow.addTask('MIP_compound');
		await workflow.addTask('illumination_correction');
	});

	const rows = modal.getByRole('row');

	await test.step('Open type filters flow modal', async () => {
		await page.getByRole('button', { name: 'Type filters flow' }).click();
		await modal.waitFor();
		await expect(rows).toHaveCount(4);
		// First row
		await expect(rows.nth(1).getByRole('cell').nth(0)).toHaveText('cellpose_segmentation');
		// Second row
		await expect(rows.nth(2).getByRole('cell').nth(0)).toHaveText('MIP_compound');
		await expect(rows.nth(2).getByRole('cell').nth(2)).toContainText('3D');
		await expect(rows.nth(2).getByRole('cell').nth(3)).toContainText('3D');
		// Third row
		await expect(rows.nth(3).getByRole('cell').nth(0)).toHaveText('illumination_correction');
		await expect(rows.nth(3).getByRole('cell').nth(1)).toContainText('3D');
		await expect(rows.nth(3).getByRole('cell').nth(2)).toContainText('illumination_correction');
		await expect(rows.nth(3).getByRole('cell').nth(3)).toContainText('illumination_correction');
	});
});
