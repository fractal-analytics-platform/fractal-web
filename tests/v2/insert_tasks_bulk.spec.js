import { waitModal, waitModalClosed, waitPageLoading } from '../utils.js';
import { checkTasksOrder } from './task_utils.js';
import { expect, test } from './workflow_fixture.js';

test('Bulk workflow tasks insertion', async ({ page, workflow }) => {
	await page.waitForURL(workflow.url);
	await waitPageLoading(page);

	await test.step('Add two tasks', async () => {
		await page.getByRole('button', { name: 'Add task to workflow' }).click();
		const modal = await waitModal(page);
		await modal.getByRole('checkbox', { name: 'generic_task', exact: true }).click();
		await modal.getByRole('checkbox', { name: 'MIP_compound' }).click();
		await modal.getByRole('button', { name: 'Add 2 tasks' }).click();
		await waitModalClosed(page);

		await checkTasksOrder(page, 'generic_task', 'MIP_compound');
	});

	await test.step('Set alias to first task', async () => {
		await workflow.selectTask('generic_task');
		await page.getByRole('button', { name: 'Info', exact: true }).click();
		await page.getByRole('button', { name: 'Edit workflow task alias' }).click();
		await page.getByRole('textbox', { name: 'Workflow task alias' }).fill('foo');
		await page.getByRole('button', { name: 'Save', exact: true }).click();
		await expect(page.getByRole('button', { name: 'Edit workflow task alias' })).not.toBeVisible();
	});

	await test.step('Add two tasks in between', async () => {
		await page.getByRole('button', { name: 'Add task to workflow' }).click();
		const modal = await waitModal(page);
		await modal.getByRole('checkbox', { name: 'out_of_memory' }).click();
		await modal.getByRole('checkbox', { name: 'illumination_correction', exact: true }).click();
		await modal.getByRole('combobox', { name: 'Add after' }).selectOption('foo');
		await modal.getByRole('button', { name: 'Add 2 tasks' }).click();
		await waitModalClosed(page);

		await checkTasksOrder(page, 'foo', 'out_of_memory', 'illumination_correction', 'MIP_compound');
	});

	await test.step('Add 1 task at the end', async () => {
		await page.getByRole('button', { name: 'Add task to workflow' }).click();
		const modal = await waitModal(page);
		await modal.getByRole('checkbox', { name: 'apply_registration_to_image' }).click();
		await modal.getByRole('button', { name: 'Add 1 task' }).click();
		await waitModalClosed(page);

		await checkTasksOrder(
			page,
			'foo',
			'out_of_memory',
			'illumination_correction',
			'MIP_compound',
			'apply_registration_to_image'
		);
	});
});
