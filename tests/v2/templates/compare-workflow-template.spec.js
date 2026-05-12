import { expect, test } from '../project_fixture.js';
import { createDataset } from '../../utils/v2/dataset.js';
import { createTemplate } from '../../utils/templates';
import { closeModal, waitModal, waitModalClosed, waitPageLoading } from '../../utils/utils';

const templateTasksList = [
	{
		meta_non_parallel: {
			key1: 'value1'
		},
		meta_parallel: {
			key2: 'value2'
		},
		args_non_parallel: {
			image_dir: '/tmp',
			num_images: 2
		},
		args_parallel: null,
		type_filters: {},
		description: null,
		alias: null,
		task: {
			pkg_name: 'fractal-tasks-mock',
			version: '0.0.1',
			name: 'create_ome_zarr_compound'
		}
	},
	{
		meta_non_parallel: null,
		meta_parallel: null,
		args_non_parallel: {
			suffix: 'new'
		},
		args_parallel: null,
		type_filters: {},
		description: null,
		alias: null,
		task: {
			pkg_name: 'fractal-tasks-mock',
			version: '0.0.1',
			name: 'MIP_compound'
		}
	}
];

test('Compare workflow to template', async ({ page, project }) => {
	await createDataset(page, project.projectId);
	const template = await createTemplate(page, templateTasksList);

	await test.step('Go to project page and create workflow from template', async () => {
		await page.goto(project.url);
		await waitPageLoading(page);

		await page.getByRole('button', { name: 'Create new workflow' }).click();
		const modal = await waitModal(page);
		await modal.getByLabel('Create from template').check();

		await modal
			.getByRole('row', { name: template.name })
			.getByRole('button', { name: 'Select' })
			.click();
		await page.waitForURL(/\/v2\/projects\/\d+\/workflows\/\d+/);
		await waitPageLoading(page);
	});

	await test.step('Check compare modal', async () => {
		await page.getByRole('button', { name: 'Compare workflow to template' }).click();
		const modal = await waitModal(page);

		await expect(modal.getByText('Non-parallel arguments match.')).toHaveCount(2);

		await modal.getByRole('button', { name: 'create_ome_zarr_compound' }).click();
		await expect(
			modal.getByText('Matching task (fractal-tasks-mock, 0.0.1, create_ome_zarr_compound)')
		).toBeVisible();

		await modal.getByRole('button', { name: 'MIP_compound' }).click();
		await expect(
			modal.getByText('Matching task (fractal-tasks-mock, 0.0.1, MIP_compound)')
		).toBeVisible();

		await closeModal(page);
	});

	await test.step('Trigger save/discard arguments modal', async () => {
		await page.getByRole('button', { name: 'MIP_compound' }).first().click();
		await page.getByRole('textbox', { name: 'Suffix' }).fill('newX');

		await page.getByRole('button', { name: 'Compare workflow to template' }).click();
		const modal1 = await waitModal(page);
		await expect(modal1.getByText(/There are argument changes unsaved/)).toBeVisible();
		await modal1.getByRole('button', { name: 'Save changes' }).click();
		await waitModalClosed(page);
		await expect(page.getByText(/Arguments changes saved successfully/)).toBeVisible();

		await page.getByRole('button', { name: 'Compare workflow to template' }).click();
		const modal2 = await waitModal(page);
		await modal2.getByRole('button', { name: 'MIP_compound' }).click();
		await expect(modal2.getByText('Non-parallel arguments match.')).toHaveCount(1);
	});
});
