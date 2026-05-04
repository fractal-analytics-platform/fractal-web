import { expect } from '@playwright/test';
import { waitModal, waitModalClosed, waitPageLoading } from '../../utils/utils.js';
import { test } from '../workflow_fixture.js';
import { checkTasksOrder } from '../../utils/v2/task.js';

test('Duplicate workflow task', async ({ page, workflow }) => {
	await page.goto(workflow.url);
	await waitPageLoading(page);

	await test.step('Add tasks to workflow', async () => {
		await workflow.addTask('create_ome_zarr_compound');
		await workflow.addTask('MIP_compound');
	});

	await test.step('Set alias to first task', async () => {
		await workflow.selectTask('create_ome_zarr_compound');
		await page.getByRole('button', { name: 'Info', exact: true }).click();
		await page.getByRole('button', { name: 'Edit workflow task alias' }).click();
		await page.getByRole('textbox', { name: 'Workflow task alias' }).fill('foo');
		await page.getByRole('button', { name: 'Save', exact: true }).click();
		await expect(page.getByRole('button', { name: 'Edit workflow task alias' })).not.toBeVisible();
	});

	await test.step('Modify first task arguments', async () => {
		await page.getByRole('button', { name: 'Arguments', exact: true }).click();
		await page.getByRole('textbox', { name: 'Image Dir' }).fill('/tmp');
		await page.getByRole('button', { name: 'Save changes' }).click();
		await expect(page.getByText('Arguments changes saved successfully')).toBeVisible();
	});

	await test.step('Duplicate workflow task', async () => {
		await page.getByRole('button', { name: 'Duplicate workflow task' }).click();
		await checkTasksOrder(page, 'foo', 'create_ome_zarr_compound', 'MIP_compound');
		await expect(page.getByRole('textbox', { name: 'Image Dir' })).toHaveValue('/tmp');
	});

	await test.step('Set alias to duplicate', async () => {
		await page.getByRole('button', { name: 'Info', exact: true }).click();
		await page.getByRole('button', { name: 'Edit workflow task alias' }).click();
		await page.getByRole('textbox', { name: 'Workflow task alias' }).fill('foo2');
		await page.getByRole('button', { name: 'Save', exact: true }).click();
		await expect(page.getByRole('button', { name: 'Edit workflow task alias' })).not.toBeVisible();
		await page.getByRole('button', { name: 'Arguments', exact: true }).click();
		await expect(page.getByRole('button', { name: 'foo2' })).toBeVisible();
		await checkTasksOrder(page, 'foo', 'foo2', 'MIP_compound');
	});

	await test.step('Attempt to duplicate with unsaved changes - Discard changes', async () => {
		await page.getByRole('textbox', { name: 'Image Dir' }).fill('/tmp1234');
		await page.getByRole('button', { name: 'Duplicate workflow task' }).click();
		const modal = await waitModal(page);
		await modal.getByRole('button', { name: 'Discard changes' }).click();
		await waitModalClosed(page);
		await expect(page.getByRole('textbox', { name: 'Image Dir' })).toHaveValue('/tmp');
	});

	await test.step('Attempt to duplicate with unsaved changes - Save changes', async () => {
		await page.getByRole('button', { name: 'Arguments', exact: true }).click();
		await page.getByRole('textbox', { name: 'Image Dir' }).fill('/tmp1234');
		await page.getByRole('button', { name: 'Duplicate workflow task' }).click();
		const modal = await waitModal(page);
		await modal.getByRole('button', { name: 'Save changes' }).click();
		await waitModalClosed(page);
		await expect(page.getByRole('textbox', { name: 'Image Dir' })).toHaveValue('/tmp1234');
		await expect(page.getByText('Arguments changes saved successfully')).toBeVisible();
	});

	await test.step('Duplicate second workflow task', async () => {
		await page.getByRole('button', { name: 'Duplicate workflow task' }).click();
		await checkTasksOrder(page, 'foo', 'foo2', 'create_ome_zarr_compound', 'MIP_compound');
		await expect(page.getByRole('textbox', { name: 'Image Dir' })).toHaveValue('/tmp1234');
	});
});
