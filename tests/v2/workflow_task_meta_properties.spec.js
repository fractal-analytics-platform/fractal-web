import { expect, test } from './workflow_fixture.js';
import { waitPageLoading } from '../utils.js';
import { createFakeTask, deleteTask } from './task_utils.js';

test('Workflow task meta properties [v2]', async ({ page, workflow }) => {
	await page.waitForURL(workflow.url);
	await waitPageLoading(page);

	let taskName;
	await test.step('Create test tasks', async () => {
		taskName = await createFakeTask(page, { type: 'compound' });
	});

	await test.step('Open workflow page', async () => {
		await workflow.openWorkflowPage();
	});

	await test.step('Add tasks to workflow', async () => {
		await workflow.addUserTask(taskName);
		await workflow.selectTask(taskName);
	});

	await test.step('Open Meta tab', async () => {
		await page.getByText('Meta', { exact: true }).click();
	});

	const tab = page.locator('#meta-tab');

	await test.step('Add non parallel properties', async () => {
		const addPropertyBtn = tab.getByRole('button', { name: 'Add property' }).nth(0);
		await addPropertyBtn.click();
		await tab.getByPlaceholder('Argument name').fill('k1');
		await tab.getByPlaceholder('Argument value').fill('v1');

		await addPropertyBtn.click();
		await tab.getByRole('textbox', { name: 'Argument name' }).nth(1).fill('k2');
		await tab.getByRole('combobox').nth(1).selectOption('Object');
		await tab.locator('.accordion-button').click();
		const objectContainer = tab.locator('.accordion-body');

		await objectContainer.getByRole('button', { name: 'Add property' }).click();
		await objectContainer.getByPlaceholder('Argument name').fill('k3');
		await objectContainer.getByRole('combobox').selectOption('Number');
		await objectContainer.getByRole('spinbutton').fill('42');

		// Invalid property (empty key)
		await addPropertyBtn.click();
	});

	await test.step('Add parallel properties', async () => {
		const addPropertyBtn = tab.getByRole('button', { name: 'Add property' }).nth(2);
		await addPropertyBtn.click();
		await tab.getByPlaceholder('Argument name').nth(4).fill('k4');
		await tab.getByRole('combobox').nth(3).selectOption('Array');

		await tab.locator('.accordion-button').nth(1).click();
		const arrayContainer = tab.locator('.accordion-body').nth(1);
		await arrayContainer.getByRole('button', { name: 'Add property' }).click();
		await arrayContainer.getByRole('combobox').selectOption('Boolean');

		// Invalid property (empty number)
		await addPropertyBtn.click();
		await arrayContainer.getByRole('combobox').nth(2).selectOption('Number');
	});

	await test.step('Check validation', async () => {
		await tab.getByRole('button', { name: 'Save changes' }).click();
		await expect(tab.getByText("Property name can't be empty")).toHaveCount(1);
		await expect(tab.getByText('Invalid number')).toHaveCount(1);
	});

	await test.step('Delete invalid properties', async () => {
		await tab.getByLabel('Remove property').nth(3).click();
		await tab.getByLabel('Remove property').nth(5).click();
		await expect(tab.getByText("Property name can't be empty")).toHaveCount(0);
		await expect(tab.getByText('Invalid number')).toHaveCount(0);
	});

	await test.step('Save changes', async () => {
		await tab.getByRole('button', { name: 'Save changes' }).click();
		await expect(tab.getByRole('button', { name: 'Save changes' })).toBeDisabled();
	});

	await test.step('Reload the page and verify the saved properties', async () => {
		await page.reload();
		await workflow.selectTask(taskName);
		await page.getByText('Meta', { exact: true }).click();

		await expect(tab.getByLabel('Remove property')).toHaveCount(5);
		await expect(tab.getByRole('textbox', { name: 'Argument name' }).first()).toHaveValue('k1');
		await expect(tab.getByRole('textbox', { name: 'Argument value' }).first()).toHaveValue(
			'v1'
		);
		await tab.locator('.accordion-button').first().click();
		const objectContainer = tab.locator('.accordion-body').first();
		await expect(objectContainer.getByRole('spinbutton')).toHaveValue('42');
		await tab.locator('.accordion-button').nth(1).click();
		const arrayContainer = tab.locator('.accordion-body').nth(1);
		await expect(
			arrayContainer.getByRole('combobox').nth(0).getByRole('option', { selected: true })
		).toHaveText('True');
	});

	await test.step('Cleanup', async () => {
		await workflow.removeCurrentTask();
		await deleteTask(page, taskName);
	});
});
