import { selectSlimSelect, waitModalClosed, waitPageLoading } from '../utils.js';
import { createImage } from './image_utils.js';
import { expect, test } from './workflow_fixture.js';

test('Image list visibility in run workflow modal', async ({ page, workflow }) => {
	await page.waitForURL(workflow.url);
	await waitPageLoading(page);

	await page.goto(`/v2/projects/${workflow.projectId}`);
	await waitPageLoading(page);

	const modal = page.locator('.modal.show');
	const randomPath = `/tmp/${Math.random().toString(36).substring(7)}`;

	await test.step('Create test dataset', async () => {
		const createDatasetButton = page.getByRole('button', { name: 'Create new dataset' });
		await createDatasetButton.click();
		await modal.waitFor();
		await modal.getByRole('textbox', { name: 'Dataset Name' }).fill('test-dataset');
		await modal.getByRole('textbox', { name: 'Zarr dir' }).fill(randomPath);
		await modal.getByRole('button', { name: 'Save' }).click();
		await waitModalClosed(page);
	});

	await test.step('Open workflow page and verify that image list is not displayed', async () => {
		await page.goto(workflow.url);
		await waitPageLoading(page);
		await workflow.addTask('generic_task');
		await page.getByRole('button', { name: 'Run workflow' }).click();
		await modal.waitFor();
		await expect(modal.getByText('Image list')).not.toBeVisible();
	});

	await test.step('Add images to the dataset', async () => {
		await page.goto(`/v2/projects/${workflow.projectId}`);
		await waitPageLoading(page);
		await page.getByRole('link', { name: 'test-dataset' }).click();
		await waitPageLoading(page);
		await createImage(page, `${randomPath}/img1`, { a1: 'v1' });
		await createImage(page, `${randomPath}/img2`, { a2: 'v2' });
	});

	await test.step('Add dataset filters that exclude all images', async () => {
		await page.getByText('Current selection').click();
		await expect(page.getByText(/Total results: 2/)).toBeVisible();
		await selectSlimSelect(page, page.getByLabel('Selector for attribute a1'), 'v1');
		await page.getByRole('button', { name: 'Apply' }).click();
		await selectSlimSelect(page, page.getByLabel('Selector for attribute a2'), 'v2');
		await page.getByRole('button', { name: 'Apply' }).click();
		await expect(page.getByText(/Total results: 0/)).toBeVisible();
		await page.getByRole('button', { name: 'Save' }).click();
		await modal.getByRole('button', { name: 'Confirm' }).click();
		await waitModalClosed(page);
		await expect(page.getByRole('button', { name: 'Save' })).toBeDisabled();
	});

	await test.step('Open workflow page and verify that image list is displayed and table is empty', async () => {
		await page.goto(workflow.url);
		await waitPageLoading(page);
		await page.getByRole('button', { name: 'Run workflow' }).click();
		await modal.waitFor();
		await expect(modal.getByRole('button', { name: 'Image list' })).toBeVisible();
		await modal.getByRole('button', { name: 'Image list' }).click();
		await expect(modal.getByText(/Total results: 0/)).toBeVisible();
	});

	await test.step('Deselect filter and check result', async () => {
		await modal.locator('.ss-deselect').first().click();
		await modal.getByRole('button', { name: 'Apply' }).click();
		await expect(modal.getByText(/Total results: 1/)).toBeVisible();
	});
});
