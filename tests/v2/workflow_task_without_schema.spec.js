import { expect, test } from './workflow_fixture.js';
import { waitPageLoading } from '../utils.js';
import { createFakeTask, deleteTask } from './task_utils.js';

test('Workflow task without JSON Schema [v2]', async ({ page, workflow }) => {
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
		await workflow.addTask(taskName);
		await workflow.selectTask(taskName);
	});

	const tab = page.locator('#args-tab');

	await test.step('Add non parallel arguments', async () => {
		const addPropertyBtn = tab.getByRole('button', { name: 'Add property' }).nth(0);

		// String property
		await addPropertyBtn.click();
		await tab.getByRole('textbox', { name: 'Argument name' }).fill('k1');
		await tab.getByRole('textbox', { name: 'Argument value' }).fill('foo');

		// Number property
		await addPropertyBtn.click();
		await tab.getByRole('textbox', { name: 'Argument name' }).nth(1).fill('k2');
		await tab.getByRole('combobox').nth(1).selectOption('Number');
		await tab.getByRole('spinbutton').fill('42');

		// Boolean property
		await addPropertyBtn.click();
		await tab.getByRole('textbox', { name: 'Argument name' }).nth(2).fill('k3');
		await tab.getByRole('combobox').nth(2).selectOption('Boolean');
		await expect(
			tab.getByRole('combobox').nth(2).getByRole('option', { selected: true })
		).toHaveText('True');
		await tab.getByRole('combobox').nth(2).selectOption('False');

		// Invalid property (empty key)
		await addPropertyBtn.click();
	});

	await test.step('Add parallel arguments', async () => {
		const addPropertyBtn = tab.getByRole('button', { name: 'Add property' }).nth(1);

		// Object property
		await addPropertyBtn.click();
		await tab.getByRole('textbox', { name: 'Argument name' }).nth(4).fill('k4');
		await tab.getByRole('combobox').nth(5).selectOption('Object');
		await tab.locator('.accordion-button').click();
		const objectContainer = tab.locator('.accordion-body');

		// Add nested array
		objectContainer.getByRole('button', { name: 'Add property' }).click();
		await objectContainer.getByRole('textbox', { name: 'Argument name' }).fill('k5');
		await objectContainer.getByRole('combobox').selectOption('Array');
		await objectContainer.locator('.accordion-button').click();
		const arrayContainer = objectContainer.locator('.accordion-body');

		// Add array string property
		arrayContainer.getByRole('button', { name: 'Add property' }).click();
		await expect(arrayContainer.getByRole('textbox', { name: 'Argument name' })).toHaveCount(0);
		await arrayContainer.getByRole('textbox', { name: 'Argument value' }).fill('bar');

		// Add nested object
		arrayContainer.getByRole('button', { name: 'Add property' }).click();
		await expect(arrayContainer.getByRole('textbox', { name: 'Argument name' })).toHaveCount(0);
		await arrayContainer.getByRole('combobox').nth(1).selectOption('Object');
		await arrayContainer.locator('.accordion-button').click();
		const childObjectContainer = arrayContainer.locator('.accordion-body');

		// Add child object property
		childObjectContainer.getByRole('button', { name: 'Add property' }).click();
		await childObjectContainer.getByRole('textbox', { name: 'Argument name' }).fill('k6');
		await childObjectContainer.getByRole('textbox', { name: 'Argument value' }).fill('k6');

		// Add duplicated child object property (invalid)
		childObjectContainer.getByRole('button', { name: 'Add property' }).click();
		await childObjectContainer.getByRole('textbox', { name: 'Argument name' }).nth(1).fill('k6');
		await childObjectContainer
			.getByRole('textbox', { name: 'Argument value' })
			.nth(1)
			.fill('k6');
	});

	await test.step('Check validation', async () => {
		await tab.getByRole('button', { name: 'Save changes' }).click();
		await expect(tab.getByText("Property name can't be empty")).toHaveCount(1);
		await expect(tab.getByText('Property name "k6" is already used')).toHaveCount(1);
	});

	await test.step('Delete invalid properties', async () => {
		await tab.getByLabel('Remove property').nth(3).click();
		await tab.getByLabel('Remove property').nth(8).click();
		await expect(tab.getByText("Property name can't be empty")).toHaveCount(0);
		await expect(tab.getByText('Property name "k6" is already used')).toHaveCount(0);
	});

	await test.step('Save changes', async () => {
		await tab.getByRole('button', { name: 'Save changes' }).click();
		await expect(tab.getByText('Arguments changes saved successfully')).toHaveCount(1);
		await expect(tab.getByRole('button', { name: 'Save changes' })).toBeDisabled();
	});

	await test.step('Reload the page and verify the saved properties', async () => {
		await page.reload();
		await workflow.selectTask(taskName);
		await expect(tab.getByLabel('Remove property')).toHaveCount(8);
		await expect(tab.getByRole('textbox', { name: 'Argument name' }).first()).toHaveValue('k1');
		await expect(tab.getByRole('textbox', { name: 'Argument value' }).first()).toHaveValue(
			'foo'
		);
		await expect(
			tab.getByRole('combobox').nth(2).getByRole('option', { selected: true })
		).toHaveText('False');
		await tab.locator('.accordion-button').first().click();
		const objectContainer = tab.locator('.accordion-body').first();
		await objectContainer.locator('.accordion-button').first().click();
		const arrayContainer = objectContainer.locator('.accordion-body');
		await expect(
			arrayContainer.getByRole('textbox', { name: 'Argument value' })
		).toHaveValue('bar');
	});

	await test.step('Cleanup', async () => {
		await workflow.removeCurrentTask();
		await deleteTask(page, taskName);
	});
});
