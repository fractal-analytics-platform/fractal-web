import { waitModalClosed, waitPageLoading } from '../utils.js';
import { expect, test } from './workflow_fixture.js';

test('View images in run workflow modal', async ({ page, workflow }) => {
	await page.waitForURL(workflow.url);
	await waitPageLoading(page);

	await page.goto(`/v2/projects/${workflow.projectId}`);
	await waitPageLoading(page);

	const randomPath = `/tmp/${Math.random().toString(36).substring(7)}`;

	await test.step('Create test dataset', async () => {
		const createDatasetButton = page.getByRole('button', { name: 'Create new dataset' });
		await createDatasetButton.click();
		const modal = page.locator('.modal.show');
		await modal.waitFor();
		await modal.getByRole('textbox', { name: 'Dataset Name' }).fill('test-dataset');
		await modal.getByRole('textbox', { name: 'Zarr dir' }).fill(randomPath);
		await modal.getByRole('button', { name: 'Save' }).click();
		await waitModalClosed(page);
	});

	/** @type {string} */
	let datasetUrl;

	await test.step('Open test dataset', async () => {
		await page.getByRole('link', { name: 'test-dataset' }).click();
		await page.waitForURL(/\/v2\/projects\/\d+\/datasets\/\d+/);
		datasetUrl = page.url();
		await expect(page.getByText('No entries in the image list yet')).toBeVisible();
	});

	await test.step('Create test images', async () => {
		await createImage(
			page,
			`${randomPath}/plate1.zarr/B/03/0`,
			{ k1: 'v1', k2: 'v1' },
			{ t1: false }
		);
		await createImage(
			page,
			`${randomPath}/plate1.zarr/B/03/1`,
			{ k1: 'v1', k2: 'v2' },
			{ t1: true }
		);
		await createImage(
			page,
			`${randomPath}/plate1.zarr/B/03/2`,
			{ k1: 'v2', k2: 'v3' },
			{ t1: false }
		);
		await createImage(page, `${randomPath}/plate1.zarr/B/03/3`, { k3: 'v1', k4: 'v1' });
		await createImage(page, `${randomPath}/plate1.zarr/B/03/4`, { k3: 'v2', k4: 'v2' });
	});

	await test.step('Open workflow page', async () => {
		await page.goto(workflow.url);
		await waitPageLoading(page);
		await workflow.addTask('generic_task');
	});

	await test.step('Check images', async () => {
		await page.getByRole('button', { name: 'Run workflow' }).click();
		const modal = page.locator('.modal.show');
		await modal.waitFor();
		await modal.getByRole('button', { name: 'Image list', exact: true }).click();
		await expect(modal.getByRole('row')).toHaveCount(7);
	});

	await test.step('Add dataset filters', async () => {
		await page.goto(datasetUrl);
		await waitPageLoading(page);
		await page.getByRole('button', { name: 'Filters', exact: true }).click();
		const modal = page.locator('.modal.show');
		await modal.waitFor();
		await modal.getByRole('button', { name: 'Add attribute filter' }).click();
		await modal.getByPlaceholder('Key').last().fill('k1');
		await modal.getByPlaceholder('Value').last().fill('v1');
		await modal.getByRole('button', { name: 'Save' }).click();
		await waitModalClosed(page);
	});

	await test.step('Check images with dataset filter', async () => {
		await page.goto(workflow.url);
		await waitPageLoading(page);
		await page.getByRole('button', { name: 'Run workflow' }).click();
		const modal = page.locator('.modal.show');
		await modal.waitFor();
		await modal.getByRole('button', { name: 'Image list', exact: true }).click();
		await expect(modal.getByRole('row')).toHaveCount(4);
		await modal.getByRole('button', { name: 'Close' }).click();
		await waitModalClosed(page);
	});

	await test.step('Add input filter', async () => {
		await workflow.selectTask('generic_task');
		await page.getByText('Input Filters').click();
		await page.getByRole('button', { name: 'Add attribute filter' }).click();
		await page.getByPlaceholder('Key').last().fill('k1');
		await page.getByPlaceholder('Value').last().fill('v2');
		await page.getByRole('button', { name: 'Save' }).click();
	});

	await test.step('Check images with input filter', async () => {
		await page.waitForURL(workflow.url);
		await waitPageLoading(page);
		await page.getByRole('button', { name: 'Run workflow' }).click();
		const modal = page.locator('.modal.show');
		await modal.waitFor();
		await modal.getByRole('button', { name: 'Image list', exact: true }).click();
		await expect(modal.getByRole('row')).toHaveCount(3);
		await modal.getByRole('button', { name: 'Close' }).click();
		await waitModalClosed(page);
	});
});

/**
 * @param {import('@playwright/test').Page} page
 * @param {string} zarrUrl
 * @param {{[key: string]: string}} attributes
 * @param {{[key: string]: boolean}} types
 */
async function createImage(page, zarrUrl, attributes = {}, types = {}) {
	const newImageBtn = page.getByRole('button', { name: 'Add an image list entry' });
	await newImageBtn.waitFor();
	await newImageBtn.click();
	const modal = page.locator('.modal.show');
	await modal.waitFor();
	await modal.getByRole('textbox', { name: 'Zarr URL' }).fill(zarrUrl);
	for (const [key, value] of Object.entries(attributes)) {
		await modal.getByRole('button', { name: 'Add attribute' }).click();
		await modal.getByPlaceholder('Key').last().fill(key);
		await modal.getByPlaceholder('Value').last().fill(value);
	}
	for (const [key, value] of Object.entries(types)) {
		await modal.getByRole('button', { name: 'Add type' }).click();
		await modal.getByPlaceholder('Key').last().fill(key);
		if (value) {
			await modal.getByRole('switch').last().click();
		}
	}
	await modal.getByRole('button', { name: 'Save' }).click();
	await waitModalClosed(page);
}
