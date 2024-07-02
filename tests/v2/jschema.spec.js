import { waitModalClosed, waitPageLoading } from '../utils.js';
import { expect, test } from './workflow_fixture.js';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';
import { createFakeTask } from './task_utils.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test('JSON Schema validation', async ({ page, workflow }) => {
	await page.waitForURL(workflow.url);
	await waitPageLoading(page);

	await test.step('Go to "Add a single task" form', async () => {
		await page.goto('/v2/tasks');
		await waitPageLoading(page);
		await page.getByText('Single task').click();
	});

	/** @type {string} */
	let randomTaskName;

	await test.step('Create test task', async () => {
		const argsSchemaFile = path.join(__dirname, '..', 'data', 'test-schema.json');
		const argsSchema = JSON.parse(fs.readFileSync(argsSchemaFile).toString());
		randomTaskName = await createFakeTask(page, {
			name: randomTaskName,
			type: 'parallel',
			args_schema_parallel: argsSchema
		});
	});

	await test.step('Add task to workflow and select it', async () => {
		await workflow.openWorkflowPage();
		await workflow.addUserTask(randomTaskName);
		await workflow.selectTask(randomTaskName);
	});

	const form = page.locator('#jschema-parallel');

	await test.step('Fill required string', async () => {
		const input = form.getByLabel('Required string', { exact: true });
		await input.fill('foo');
		await input.fill('');
		expect(form.getByText('Field is required')).toHaveCount(1);
		await input.fill('bar');
		expect(form.getByText('Field is required')).toHaveCount(0);
		// Check that export button is disabled when there are some pending changes
		expect(await page.getByRole('button', { name: 'Export' }).isDisabled()).toEqual(true);
	});

	await test.step('Fill optional string', async () => {
		const input = form.getByLabel('Optional string', { exact: true });
		await input.fill('foo');
		await input.fill('');
		expect(form.getByText('Field is required')).toHaveCount(0);
	});

	await test.step('Select required option', async () => {
		await page.getByRole('combobox', { name: 'Required enum' }).selectOption('option1');
		await page.getByRole('combobox', { name: 'Required enum' }).selectOption('null');
		expect(form.getByText('Field is required')).toHaveCount(1);
		await page.getByRole('combobox', { name: 'Required enum' }).selectOption('option1');
		expect(form.getByText('Field is required')).toHaveCount(0);
	});

	await test.step('Select optional option', async () => {
		await page.getByRole('combobox', { name: 'Optional enum' }).selectOption('option1');
		await page.getByRole('combobox', { name: 'Optional enum' }).selectOption('null');
		expect(form.getByText('Field is required')).toHaveCount(0);
	});

	await test.step('Fill required integer with min and max', async () => {
		const input = form.getByLabel('minMaxRequiredInt', { exact: true });
		// Note: the only allowed characted in chrome is an "e" (for the scientific notation)
		await input.pressSequentially('e');
		expect(form.getByText('Should be a number')).toHaveCount(1);
		await input.fill('1');
		expect(form.getByText('Should be greater or equal than 5')).toHaveCount(1);
		await input.fill('15');
		expect(form.getByText('Should be lower or equal than 10')).toHaveCount(1);
		await input.fill('');
		expect(form.getByText('Field is required')).toHaveCount(1);
		await input.fill('8');
		expect(form.getByText('Field is required')).toHaveCount(0);
	});

	await test.step('Fill optional integer with min and max', async () => {
		const input = form.getByLabel('minMaxOptionalInt', { exact: true });
		// Note: the only allowed characted in chrome is an "e" (for the scientific notation)
		await input.pressSequentially('e');
		expect(form.getByText('Should be a number')).toHaveCount(1);
		await input.fill('-7');
		expect(form.getByText('Should be greater or equal than 0')).toHaveCount(1);
		await input.fill('33');
		expect(form.getByText('Should be lower or equal than 8')).toHaveCount(1);
		await input.fill('');
		expect(form.getByText('Field is required')).toHaveCount(0);
	});

	await test.step('Fill optional integer with exclusive min and max', async () => {
		const input = form.getByLabel('exclusiveMinMaxOptionalInt', { exact: true });
		// Note: the only allowed characted in chrome is an "e" (for the scientific notation)
		await input.pressSequentially('e');
		expect(form.getByText('Should be a number')).toHaveCount(1);
		await input.fill('2');
		expect(form.getByText('Should be greater or equal than 4')).toHaveCount(1);
		await input.fill('99');
		expect(form.getByText('Should be lower or equal than 41')).toHaveCount(1);
		await input.fill('');
		expect(form.getByText('Field is required')).toHaveCount(0);
	});

	await test.step('Required boolean', async () => {
		const booleanSwitch = form.getByRole('switch');
		expect(await booleanSwitch.isChecked()).toEqual(false);
		await booleanSwitch.check();
		expect(await booleanSwitch.isChecked()).toEqual(true);
		await booleanSwitch.uncheck();
		expect(await booleanSwitch.isChecked()).toEqual(false);
	});

	await test.step('Required array with minItems and maxItems', async () => {
		const addBtn = form.getByRole('button', { name: 'Add argument to list' }).first();
		await addBtn.click();
		await addBtn.click();
		expect(await addBtn.isDisabled()).toEqual(true);
		const block = form.locator('.property-block', {
			has: page.getByText('requiredArrayWithMinMaxItems')
		});
		// Fill items
		await block.getByRole('textbox').nth(0).fill('a');
		await block.getByRole('textbox').nth(1).fill('b');
		await block.getByRole('textbox').nth(2).fill('c');
		await block.getByRole('textbox').nth(3).fill('d');
		// Move "d" up
		await page.getByRole('button', { name: 'Move item up' }).nth(3).click();
		await page.getByRole('button', { name: 'Move item up' }).nth(2).click();
		await page.getByRole('button', { name: 'Move item up' }).nth(1).click();
		await checkFirstArray(block, ['d', 'a', 'b', 'c']);
		// Move "d" down
		await page.getByRole('button', { name: 'Move item down' }).first().click();
		await page.getByRole('button', { name: 'Move item down' }).nth(1).click();
		await checkFirstArray(block, ['a', 'b', 'd', 'c']);
		// Remove items
		await form.getByRole('button', { name: 'Remove' }).nth(3).click();
		expect(await addBtn.isDisabled()).toEqual(false);
		await form.getByRole('button', { name: 'Remove' }).nth(2).click();
		await checkFirstArray(block, ['a', 'b']);
		await form.getByRole('button', { name: 'Clear' }).nth(1).click();
		await checkFirstArray(block, ['a', '']);
	});

	/**
	 * @param {import('@playwright/test').Locator} block
	 * @param {string[]} expectedValues
	 */
	async function checkFirstArray(block, expectedValues) {
		for (let i = 0; i < expectedValues.length; i++) {
			expect(await block.getByRole('textbox').nth(i).inputValue()).toEqual(expectedValues[i]);
		}
	}

	await test.step('Optional array with minItems and maxItems', async () => {
		await form.getByText('optionalArrayWithMinMaxItems').first().click();
		const addBtn = form.getByRole('button', { name: 'Add argument to list' }).nth(1);
		await addBtn.click();
		await addBtn.click();
		await addBtn.click();
		expect(await addBtn.isDisabled()).toEqual(true);
		const block = form.locator('.property-block', {
			has: page.getByText('optionalArrayWithMinMaxItems')
		});
		await block.getByRole('textbox').nth(0).fill('a');
		await block.getByRole('textbox').nth(1).fill('b');
		await block.getByRole('textbox').nth(2).fill('c');
		await form.getByRole('button', { name: 'Remove' }).nth(2).click();
		expect(await addBtn.isDisabled()).toEqual(false);
		await form.getByRole('button', { name: 'Remove' }).nth(1).click();
		await form.getByRole('button', { name: 'Remove' }).nth(0).click();
		expect(block.getByRole('textbox')).toHaveCount(0);
	});

	await test.step('Object with nested properties', async () => {
		await page.getByRole('textbox', { name: 'requiredNestedString' }).fill('nested string');
		await page.getByLabel('Required Min', { exact: true }).fill('1');
		await page.getByLabel('Optional Max', { exact: true }).fill('5');
	});

	await test.step('Attempt to save with missing required fields', async () => {
		expect(form.getByText('Field is required')).toHaveCount(0);
		const stringInput = form.getByLabel('Required string', { exact: true });
		await stringInput.fill('');
		const intInput = form.getByLabel('minMaxRequiredInt', { exact: true });
		await intInput.fill('');
		await page.getByRole('button', { name: 'Save changes' }).click();
		expect(form.getByText('Field is required')).toHaveCount(2);
	});

	await test.step('Save values', async () => {
		const stringInput = form.getByLabel('Required string', { exact: true });
		await stringInput.fill('foo');
		const intInput = form.getByLabel('minMaxRequiredInt', { exact: true });
		await intInput.fill('7');
		const block = form.locator('.property-block', {
			has: page.getByText('requiredArrayWithMinMaxItems')
		});
		await block.getByRole('textbox').nth(1).fill('b');
		await page.getByRole('button', { name: 'Move item up' }).nth(1).click();
		await page.getByRole('button', { name: 'Save changes' }).click();
		await page.getByText('Arguments changes saved successfully').waitFor();
		await page.reload();
		await waitPageLoading(page);
		await workflow.selectTask(randomTaskName);
		await expect(page.getByLabel('Required string', { exact: true })).toHaveValue('foo');
		await expect(page.getByLabel('minMaxRequiredInt', { exact: true })).toHaveValue('7');
		await expect(page.getByRole('combobox', { name: 'Required enum' })).toHaveValue('option1');
		await checkFirstArray(block, ['b', 'a']);
	});

	await test.step('Bad numeric input is validated', async () => {
		const input = form.getByLabel('exclusiveMinMaxOptionalInt', { exact: true });
		// Note: the only allowed characted in chrome is an "e" (for the scientific notation)
		await input.pressSequentially('e');
		expect(form.getByText('Should be a number')).toHaveCount(1);
		await page.getByRole('button', { name: 'Save changes' }).click();
		await page.getByText('Form contains invalid input').waitFor();
		await page.getByRole('button', { name: 'Discard changes' }).click();
	});

	await test.step('Delete workflow task', async () => {
		await workflow.removeCurrentTask();
	});

	await test.step('Delete task', async () => {
		await page.goto('/v2/tasks');
		await waitPageLoading(page);
		const taskRow = /** @type {import('@playwright/test').Locator} */ (
			await getTaskRow(page, randomTaskName)
		);
		const deleteBtn = taskRow.getByRole('button', { name: 'Delete' });
		await deleteBtn.click();
		const modal = page.locator('.modal.show');
		await modal.waitFor();
		await modal.getByRole('button', { name: 'Confirm' }).click();
		await waitModalClosed(page);
		expect(await getTaskRow(page, randomTaskName)).toBeNull();
	});
});

/**
 * @param {import('@playwright/test').Page} page
 * @param {string} taskName
 * @returns {Promise<import('@playwright/test').Locator|null>}
 */
async function getTaskRow(page, taskName) {
	const rows = await page.getByRole('table').last().getByRole('row').all();
	for (const row of rows) {
		const rowText = await row.innerText();
		if (rowText.includes(taskName)) {
			return row;
		}
	}
	return null;
}
