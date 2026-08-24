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

	await test.step('Add meta to first task', async () => {
		await workflow.selectTask('create_ome_zarr_compound');
		await page.getByRole('button', { name: 'Meta', exact: true }).click();
		await expect(page.getByText(/Initialisation Meta/)).toBeVisible();
		await page.getByRole('button', { name: 'Add property', exact: true }).first().click();
		await page.getByPlaceholder('Argument name').nth(1).fill('abc');
		await page.getByPlaceholder('Argument value').nth(1).fill('xyz');
		await page.getByRole('button', { name: 'Add property', exact: true }).nth(1).click();
		await page.getByPlaceholder('Argument name').nth(3).fill('def');
		await page.getByPlaceholder('Argument value').nth(3).fill('qwe');
		await page.getByRole('button', { name: 'Save changes' }).click();
		await expect(page.getByRole('button', { name: 'Save changes' })).toBeDisabled();
	});

	await test.step('Set alias to first task', async () => {
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
		await checkTasksOrder(page, 'foo', 'foo', 'MIP_compound');
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
		const modal = await waitModal(page, false);
		await modal.getByRole('button', { name: 'Save changes' }).click();
		await waitModalClosed(page);
		await expect(page.getByRole('textbox', { name: 'Image Dir' })).toHaveValue('/tmp1234');
		await expect(page.getByText('Arguments changes saved successfully')).toBeVisible();
	});

	await test.step('Duplicate second workflow task', async () => {
		await page.getByRole('button', { name: 'Duplicate workflow task' }).click();
		await checkTasksOrder(page, 'foo', 'foo2', 'foo2', 'MIP_compound');
		await expect(page.getByRole('textbox', { name: 'Image Dir' })).toHaveValue('/tmp1234');
	});

	await test.step('Check that meta is duplicated too', async () => {
		await page.getByRole('button', { name: 'Meta', exact: true }).click();
		await expect(page.getByText(/Initialisation Meta/)).toBeVisible();
		await expect(page.getByPlaceholder('Argument name').nth(1)).toHaveValue('abc');
		await expect(page.getByPlaceholder('Argument value').nth(1)).toHaveValue('xyz');
		await expect(page.getByPlaceholder('Argument name').nth(3)).toHaveValue('def');
		await expect(page.getByPlaceholder('Argument value').nth(3)).toHaveValue('qwe');
	});
});
