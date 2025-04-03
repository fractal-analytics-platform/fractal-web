import { waitModalClosed, waitPageLoading } from '../utils.js';
import { createImage } from './image_utils.js';
import { expect, test } from './workflow_fixture.js';

test('View images in run workflow modal', async ({ page, workflow }) => {
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

	await test.step('Open test dataset', async () => {
		await page.getByRole('link', { name: 'test-dataset' }).click();
		await page.waitForURL(/\/v2\/projects\/\d+\/datasets\/\d+/);
		await expect(page.getByText('No entries in the image list yet')).toBeVisible();
	});

	await test.step('Create test images', async () => {
		await createImage(
			page,
			`${randomPath}/plate1.zarr/B/03/0`,
			{ k1: 'k1v1', k2: 'k2v1' },
			{ t1: false }
		);
		await createImage(
			page,
			`${randomPath}/plate1.zarr/B/03/1`,
			{ k1: 'k1v1', k2: 'k2v2' },
			{ t1: true }
		);
		await createImage(
			page,
			`${randomPath}/plate1.zarr/B/03/2`,
			{ k1: 'k1v2', k2: 'k2v3' },
			{ t1: false }
		);
		await createImage(page, `${randomPath}/plate1.zarr/B/03/3`, { k3: 'k3v1', k4: 'k4v1' });
		await createImage(page, `${randomPath}/plate1.zarr/B/03/4`, { k3: 'k3v2', k4: 'k4v2' });
	});

	await test.step('Open workflow page', async () => {
		await page.goto(workflow.url);
		await waitPageLoading(page);
		await workflow.addTask('generic_task');
	});

	await test.step('Check images', async () => {
		await page.getByRole('button', { name: 'Run workflow' }).click();
		await modal.waitFor();
		await expect(modal.getByRole('row')).toHaveCount(7);
		await modal.getByRole('button', { name: 'Close' }).click();
		await waitModalClosed(page);
	});

	await test.step('Add input filter', async () => {
		await workflow.selectTask('generic_task');
		await page.getByText('Types').click();
		await page.getByRole('button', { name: 'Add type filter' }).click();
		await page.getByPlaceholder('Key').last().fill('t1');
		await page.getByRole('switch').click();
		await page.getByRole('button', { name: 'Save' }).click();
	});

	await test.step('Check images with input filter', async () => {
		await page.waitForURL(workflow.url);
		await waitPageLoading(page);
		await page.getByRole('button', { name: 'Run workflow' }).click();
		await modal.waitFor();
		await expect(modal.getByRole('row')).toHaveCount(3);
		await modal.getByRole('button', { name: 'Close' }).click();
		await waitModalClosed(page);
	});
});
