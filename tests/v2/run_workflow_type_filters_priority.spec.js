import {
	expectSlimSelectValue,
	selectSlimSelect,
	waitModalClosed,
	waitPageLoading
} from '../utils.js';
import { createDataset } from './dataset_utils.js';
import { expect, test } from './workflow_fixture.js';
import { waitTaskSubmitted, waitTasksSuccess } from './workflow_task_utils.js';

test('Type filters priority in run workflow modal', async ({ page, workflow }) => {
	await page.waitForURL(workflow.url);
	await waitPageLoading(page);

	await page.goto(`/v2/projects/${workflow.projectId}`);
	await waitPageLoading(page);

	const modal = page.locator('.modal.show');

	let zarrDir;

	await test.step('Create test dataset', async () => {
		const dataset = await createDataset(page, workflow.projectId);
		zarrDir = dataset.zarrDir;
	});

	await test.step('Prepare and run workflow', async () => {
		await page.goto(workflow.url);
		await waitPageLoading(page);
		await workflow.addTask('create_ome_zarr_compound');
		await workflow.addTask('MIP_compound'); // task having 3D: true
		await workflow.addTask('illumination_correction'); // task having illumination_correction: false
	});

	await test.step('Fill create_ome_zarr_compound arguments', async () => {
		await workflow.selectTask('create_ome_zarr_compound');
		await page.getByRole('textbox', { name: 'Image Dir' }).fill(zarrDir);
		await page.getByRole('button', { name: 'Save changes' }).click();
		await page.getByText('Arguments changes saved successfully').waitFor();
	});

	await test.step('Run workflow', async () => {
		await page.getByRole('button', { name: 'Run workflow' }).click();
		await modal.waitFor();
		await page.getByRole('button', { name: 'Run', exact: true }).click();
		await page.getByRole('button', { name: 'Confirm' }).click();
		await waitModalClosed(page);
	});

	await test.step('Wait tasks submitted', async () => {
		await waitTaskSubmitted(page);
	});

	await test.step('Wait task success', async () => {
		await waitTasksSuccess(page);
	});

	await test.step('Open "Continue workflow" modal', async () => {
		await page.getByRole('button', { name: 'Continue workflow' }).click();
		await modal.waitFor();
	});

	await test.step('Check selected filters for create_ome_zarr_compound', async () => {
		await modal
			.getByRole('combobox', { name: 'Start workflow at' })
			.selectOption('create_ome_zarr_compound');
		await expect(page.getByText('Total results: 6')).toBeVisible();
		await expect(page.getByRole('row')).toHaveCount(8);
	});

	await test.step('Click Run and check error message', async () => {
		await modal.getByRole('button', { name: 'Run' }).click();
		await expect(
			page.getByText(/You are trying to run a workflow without specifying what type/)
		).toBeVisible();
	});

	await test.step('Select type and check confirm result', async () => {
		await selectSlimSelect(page, modal.getByLabel('Selector for type 3D'), 'True');
		await modal.getByRole('button', { name: 'Apply' }).click();
		await expect(modal.getByText('Total results: 2')).toBeVisible();
		await modal.getByRole('button', { name: 'Run' }).click();
		await expect(modal.getByText('Applied filters')).toBeVisible();
		await expect(
			modal.locator('li').filter({ hasText: '3D:' }).locator('[aria-checked="true"]')
		).toBeVisible();
		await modal.getByRole('button', { name: 'Cancel' }).click();
		await expect(modal.getByRole('button', { name: 'Run' })).toBeVisible();
	});

	await test.step('Check selected filters for MIP_compound', async () => {
		await modal.getByRole('combobox', { name: 'Start workflow at' }).selectOption('MIP_compound');
		await expect(
			page.getByText('Image list includes multiple values for the following types:')
		).not.toBeVisible();
		await expect(modal.getByText('Total results: 2')).toBeVisible();
		await expect(modal.getByRole('row')).toHaveCount(4);
		await expect(modal.getByRole('row').last()).toContainText('my_plate.zarr/A/02/0');
		await expectSlimSelectValue(page, 'Selector for type 3D', 'True');
	});

	await test.step('Click Run and verify confirmed values', async () => {
		await modal.getByRole('button', { name: 'Run' }).click();
		await expect(modal.getByRole('button', { name: 'Confirm' })).toBeVisible();
		await expect(modal.getByRole('listitem').locator('[aria-checked="true"]')).toBeVisible();
		await modal.getByRole('button', { name: 'Cancel' }).click();
	});

	await test.step('Check selected filters for illumination_correction', async () => {
		await modal
			.getByRole('combobox', { name: 'Start workflow at' })
			.selectOption('illumination_correction');
		await expect(modal.getByText('Total results: 2')).toBeVisible();
		await expect(modal.getByRole('row')).toHaveCount(4);
		await expect(modal.getByRole('row').last()).toContainText('my_plate_new.zarr/A/02/0');
		await expectSlimSelectValue(page, 'Selector for type 3D', 'False');
	});

	await test.step('Click Run and verify confirmed values', async () => {
		await modal.getByRole('button', { name: 'Run' }).click();
		await expect(modal.getByRole('button', { name: 'Confirm' })).toBeVisible();
		await expect(
			modal.locator('li').filter({ hasText: '3D:' }).locator('[aria-checked="false"]')
		).toBeVisible();
		await modal.getByRole('button', { name: 'Cancel' }).click();
		await modal.getByRole('button', { name: 'Close' }).click();
		await waitModalClosed(page);
	});

	await test.step('Add 3D type filter to illumination_correction', async () => {
		await workflow.selectTask('illumination_correction');
		await page.getByRole('button', { name: 'Types', exact: true }).click();
		await page.getByRole('button', { name: 'Add type filter' }).click();
		await page.getByPlaceholder('Key').fill('3D');
		await page.getByRole('switch').check();
		await page.getByRole('button', { name: 'Save' }).click();
		await expect(page.getByText('Input filters successfully updated')).toBeVisible();
	});

	await test.step('Open "Continue workflow" modal', async () => {
		await page.getByRole('button', { name: 'Continue workflow' }).click();
		await modal.waitFor();
	});

	await test.step('Check selected filters for illumination_correction', async () => {
		await modal
			.getByRole('combobox', { name: 'Start workflow at' })
			.selectOption('illumination_correction');
		await expect(modal.getByText('Total results: 2')).toBeVisible();
		await expect(modal.getByRole('row')).toHaveCount(4);
		await expect(modal.getByRole('row').last()).toContainText('my_plate.zarr/A/02/0');
		await expectSlimSelectValue(page, 'Selector for type 3D', 'True');
	});

	await test.step('Click Run and verify confirmed values', async () => {
		await modal.getByRole('button', { name: 'Run' }).click();
		await expect(modal.getByRole('button', { name: 'Confirm' })).toBeVisible();
		await expect(
			modal.locator('li').filter({ hasText: '3D:' }).locator('[aria-checked="true"]')
		).toBeVisible();
		await modal.getByRole('button', { name: 'Cancel' }).click();
	});
});
