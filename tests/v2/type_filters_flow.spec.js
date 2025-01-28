import { selectSlimSelect, waitModalClosed, waitPageLoading } from '../utils.js';
import { createImage } from './image_utils.js';
import { expect, test } from './workflow_fixture.js';

test('Type filters flow modal', async ({ page, workflow }) => {
	await page.waitForURL(workflow.url);
	await waitPageLoading(page);

	await page.goto(`/v2/projects/${workflow.projectId}`);
	await waitPageLoading(page);

	const randomPath = `/tmp/${Math.random().toString(36).substring(7)}`;
	const modal = page.locator('.modal.show');

	await test.step('Create test dataset', async () => {
		const createDatasetButton = page.getByRole('button', { name: 'Create new dataset' });
		await createDatasetButton.click();
		await modal.waitFor();
		await modal.getByRole('textbox', { name: 'Dataset Name' }).fill('test-dataset');
		await modal.getByRole('textbox', { name: 'Zarr dir' }).fill(randomPath);
		await modal.getByRole('button', { name: 'Save' }).click();
		await waitModalClosed(page);
	});

	await test.step('Add images', async () => {
		await page.getByRole('link', { name: 'test-dataset' }).click();
		await waitPageLoading(page);
		await createImage(page, `${randomPath}/img1`, {}, { t1: true });
		await createImage(page, `${randomPath}/img2`, {}, { t1: false });
	});

	await test.step('Add dataset filter', async () => {
		await page.getByText('Current selection').click();
		await expect(page.getByRole('button', { name: 'Save' })).toBeVisible();
		await expect(page.getByText(/Total results: 2/)).toBeVisible();
		await selectSlimSelect(page, page.getByLabel('Selector for type t1'), 'True');
		await page.getByRole('button', { name: 'Apply' }).click();
		await expect(page.getByRole('button', { name: 'Apply' })).toBeDisabled();
		await expect(page.getByText(/Total results: 1/)).toBeVisible();
		await page.getByRole('button', { name: 'Save' }).click();
		await modal.getByRole('button', { name: 'Confirm' }).click();
		await waitModalClosed(page);
		await expect(page.getByRole('button', { name: 'Save' })).toBeDisabled();
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
		await expect(rows.nth(1).getByRole('cell').nth(1)).toContainText('t1');
		await expect(rows.nth(1).getByRole('cell').nth(2)).toContainText('t1');
		// Second row
		await expect(rows.nth(2).getByRole('cell').nth(0)).toHaveText('MIP_compound');
		await expect(rows.nth(2).getByRole('cell').nth(1)).toContainText('t1');
		await expect(rows.nth(2).getByRole('cell').nth(2)).toContainText('t1');
		await expect(rows.nth(2).getByRole('cell').nth(2)).toContainText('3D');
		// Third row
		await expect(rows.nth(3).getByRole('cell').nth(0)).toHaveText('illumination_correction');
		await expect(rows.nth(3).getByRole('cell').nth(1)).toContainText('t1');
		await expect(rows.nth(3).getByRole('cell').nth(1)).toContainText('3D');
		await expect(rows.nth(3).getByRole('cell').nth(2)).toContainText('t1');
		await expect(rows.nth(3).getByRole('cell').nth(2)).toContainText('3D');
		await expect(rows.nth(3).getByRole('cell').nth(2)).toContainText('illumination_correction');
	});

	await test.step('Deselect dataset', async () => {
		await modal.getByRole('combobox', { name: 'Dataset' }).selectOption('Select...');
		await expect(rows.nth(1).getByRole('cell').nth(0)).toHaveText('cellpose_segmentation');
		await expect(rows.nth(1).getByRole('cell').nth(1)).not.toContainText('t1');
	});

	await test.step('Select first task', async () => {
		await modal.getByRole('combobox', { name: 'First task' }).selectOption('MIP_compound');
		await expect(rows).toHaveCount(3);
		await expect(rows.nth(1).getByRole('cell').nth(0)).toHaveText('MIP_compound');
		await expect(rows.nth(1).getByRole('cell').nth(1)).not.toContainText('t1');
		await expect(rows.nth(1).getByRole('cell').nth(2)).not.toContainText('t1');
		await expect(rows.nth(1).getByRole('cell').nth(2)).toContainText('3D');
	});

	await test.step('Select last task', async () => {
		await modal.getByRole('combobox', { name: 'Last task' }).selectOption('MIP_compound');
		await expect(rows).toHaveCount(2);
		await expect(rows.nth(1).getByRole('cell').nth(0)).toHaveText('MIP_compound');
		await expect(rows.nth(1).getByRole('cell').nth(1)).not.toContainText('t1');
		await expect(rows.nth(1).getByRole('cell').nth(2)).not.toContainText('t1');
		await expect(rows.nth(1).getByRole('cell').nth(2)).toContainText('3D');
	});
});
