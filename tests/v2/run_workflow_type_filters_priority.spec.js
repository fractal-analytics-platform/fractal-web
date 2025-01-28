import { getSlimSelectValues, selectSlimSelect, waitPageLoading } from '../utils.js';
import { createDataset } from './dataset_utils.js';
import { createImage } from './image_utils.js';
import { expect, test } from './workflow_fixture.js';

test('Type filters priority in run workflow modal', async ({ page, workflow }) => {
	await page.waitForURL(workflow.url);
	await waitPageLoading(page);

	await page.goto(`/v2/projects/${workflow.projectId}`);
	await waitPageLoading(page);

	const modal = page.locator('.modal.show');

	let zarrDir;
	let datasetName;

	await test.step('Create test dataset', async () => {
		const dataset = await createDataset(page, workflow.projectId);
		zarrDir = dataset.zarrDir;
		datasetName = dataset.name;
	});

	await test.step('Open test dataset', async () => {
		await page.getByRole('link', { name: datasetName }).click();
		await page.waitForURL(/\/v2\/projects\/\d+\/datasets\/\d+/);
		await expect(page.getByText('No entries in the image list yet')).toBeVisible();
	});

	await test.step('Create test images', async () => {
		await createImage(page, `${zarrDir}/img1`, {}, { '3D': true });
		await createImage(page, `${zarrDir}/img2`, {}, { '3D': false });
	});

	await test.step('Set dataset filters', async () => {
		await page.getByText('Current selection').click();
		await expect(page.getByRole('button', { name: 'Save' })).toBeDisabled();
		await expect(page.getByRole('row')).toHaveCount(4);
		await selectSlimSelect(page, page.getByLabel('Selector for type 3D'), 'False');
		await page.getByRole('button', { name: 'Apply', exact: true }).click();
		await expect(page.getByRole('row')).toHaveCount(3);
		await page.getByRole('button', { name: 'Save' }).click();
		await modal.waitFor();
		await modal.getByRole('button', { name: 'Confirm' }).click();
	});

	await test.step('Open "Run workflow" modal', async () => {
		await page.goto(workflow.url);
		await waitPageLoading(page);
		await workflow.addTask('MIP_compound'); // task having 3D: true
		await page.getByRole('button', { name: 'Run workflow' }).click();
		await modal.waitFor();
	});

	await test.step('Check images and selected filters', async () => {
		await modal.getByRole('button', { name: 'Image list' }).click();
		await expect(page.getByRole('row')).toHaveCount(3);
		await expect(page.getByRole('row').last()).toContainText('img1');
		const values = await getSlimSelectValues(page, page.getByLabel('Selector for type 3D'));
		expect(values).toHaveLength(1);
		expect(/** @type {string[]} */ (values)[0]).toEqual('True');
	});

	await test.step('Click Run and verify confirmed values', async () => {
		await modal.getByRole('button', { name: 'Run' }).click();
		await expect(modal.getByRole('button', { name: 'Confirm' })).toBeVisible();
		await expect(modal.getByRole('listitem').locator('[aria-checked="true"]')).toBeVisible();
	});
});
