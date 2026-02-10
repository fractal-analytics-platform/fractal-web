import { waitPageLoading } from '../utils.js';
import { expect, test } from './workflow_fixture.js';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';
import { createFakeTask, deleteTask } from './task_utils.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test('JSON Schema validation', async ({ page, workflow }) => {
	await page.waitForURL(workflow.url);
	await waitPageLoading(page);

	await test.step('Go to "Add a single task" form', async () => {
		await page.goto('/v2/tasks/management');
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
		await workflow.addTask(randomTaskName);
		await workflow.selectTask(randomTaskName);
	});

	const form = page.locator('#jschema-parallel');

	await test.step('Fill required string', async () => {
		const input = form.getByLabel('Required string', { exact: true });
		await input.fill('foo');
		await input.fill('');
		await expect(form.getByText("must have required property 'requiredString'")).toHaveCount(1);
		await input.fill('bar');
		await expect(form.getByText("must have required property 'requiredString'")).toHaveCount(0);
		// Check that export button is disabled when there are some pending changes
		await expect(page.getByRole('button', { name: /.*Export$/ })).toBeDisabled();
	});

	await test.step('Fill optional string', async () => {
		const input = form.getByLabel('Optional string', { exact: true });
		await input.fill('foo');
		await input.fill('');
	});

	await test.step('Select required option', async () => {
		await page.getByRole('combobox', { name: 'Required enum' }).selectOption('option1');
		await page.getByRole('combobox', { name: 'Required enum' }).selectOption('');
		await expect(form.getByText("must have required property 'requiredEnum'")).toHaveCount(1);
		await page.getByRole('combobox', { name: 'Required enum' }).selectOption('option1');
		await expect(form.getByText("must have required property 'requiredEnum'")).toHaveCount(0);
	});

	await test.step('Select optional option', async () => {
		await page.getByRole('combobox', { name: 'Optional enum' }).selectOption('option1');
		await page.getByRole('combobox', { name: 'Optional enum' }).selectOption('');
	});

	await test.step('Fill required integer with min and max', async () => {
		const input = form.getByLabel('minMaxRequiredInt', { exact: true });
		await expect(form.getByText("must have required property 'minMaxRequiredInt'")).toHaveCount(1);
		await input.fill('1');
		await expect(form.getByText('must be >= 5')).toHaveCount(1);
		// Note: the only allowed characted in chrome is an "e" (for the scientific notation)
		await input.pressSequentially('e');
		await expect(form.getByText('must be integer')).toHaveCount(1);
		await input.fill('15');
		await expect(form.getByText('must be <= 10')).toHaveCount(1);
		await input.fill('');
		await expect(form.getByText("must have required property 'minMaxRequiredInt'")).toHaveCount(1);
		await input.fill('8');
		await expect(form.getByText("must have required property 'minMaxRequiredInt'")).toHaveCount(0);
	});

	await test.step('Fill optional integer with min and max', async () => {
		const input = form.getByLabel('minMaxOptionalInt', { exact: true });
		// Note: the only allowed characted in chrome is an "e" (for the scientific notation)
		await input.pressSequentially('e');
		await expect(form.getByText('Should be a number')).toHaveCount(1);
		await input.fill('-7');
		await expect(form.getByText('must be >= 0')).toHaveCount(1);
		await input.fill('33');
		await expect(form.getByText('must be <= 8')).toHaveCount(1);
		await input.fill('');
	});

	await test.step('Fill optional integer with exclusive min and max', async () => {
		const input = form.getByLabel('exclusiveMinMaxOptionalInt', { exact: true });
		// Note: the only allowed characted in chrome is an "e" (for the scientific notation)
		await input.pressSequentially('e');
		await expect(form.getByText('Should be a number')).toHaveCount(1);
		await input.fill('2');
		await expect(form.getByText('must be > 3')).toHaveCount(1);
		await input.fill('99');
		await expect(form.getByText('must be < 42')).toHaveCount(1);
		await input.fill('');
	});

	await test.step('Required boolean', async () => {
		const booleanSwitch = form.getByRole('switch');
		await expect(booleanSwitch).not.toBeChecked();
		await expect(form.getByText("must have required property 'requiredBoolean'")).toHaveCount(1);
		await booleanSwitch.check();
		await expect(booleanSwitch).toBeChecked();
		await booleanSwitch.uncheck();
		await expect(booleanSwitch).not.toBeChecked();
		await expect(form.getByText("must have required property 'requiredBoolean'")).toHaveCount(0);
	});

	await test.step('Required array with minItems and maxItems', async () => {
		await expect(form.getByText("must have required property 'requiredArrayWithMinMaxItems'")).toHaveCount(1);
		const block = form.locator('.property-block', {
			has: page.getByText('requiredArrayWithMinMaxItems')
		});
		const addBtn = block.getByRole('button', { name: 'Add argument to list' });
		await addBtn.click();
		await addBtn.click();
		await expect(addBtn).toBeDisabled();
		// Fill items
		await block.getByRole('textbox').nth(0).fill('a');
		await expect(form.getByText("must NOT have fewer than 2 items")).toHaveCount(1);
		await block.getByRole('textbox').nth(1).fill('b');
		await expect(form.getByText("must NOT have fewer than 2 items")).toHaveCount(0);
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
		await expect(addBtn).not.toBeDisabled();
		await form.getByRole('button', { name: 'Remove' }).nth(2).click();
		await checkFirstArray(block, ['a', 'b']);
	});

	/**
	 * @param {import('@playwright/test').Locator} block
	 * @param {string[]} expectedValues
	 */
	async function checkFirstArray(block, expectedValues) {
		for (let i = 0; i < expectedValues.length; i++) {
			await expect(block.getByRole('textbox').nth(i)).toHaveValue(expectedValues[i]);
		}
	}

	await test.step('Optional array with minItems and maxItems', async () => {
		await form.getByText('optionalArrayWithMinMaxItems').first().click();
		const block = form.locator('.property-block', {
			has: page.getByText('optionalArrayWithMinMaxItems')
		});
		const addBtn = block.getByRole('button', { name: 'Add argument to list' });
		await addBtn.click();
		await addBtn.click();
		await addBtn.click();
		await expect(addBtn).toBeDisabled();
		await block.getByRole('textbox').nth(0).fill('a');
		await block.getByRole('textbox').nth(1).fill('b');
		await block.getByRole('textbox').nth(2).fill('c');
		await form.getByRole('button', { name: 'Remove' }).nth(2).click();
		await expect(addBtn).not.toBeDisabled();
		await form.getByRole('button', { name: 'Remove' }).nth(1).click();
		await form.getByRole('button', { name: 'Remove' }).nth(0).click();
		await expect(block.getByRole('textbox')).toHaveCount(0);
	});

	await test.step('Object with nested properties', async () => {
		await expect(form.getByText("must have required property 'requiredObject'")).toHaveCount(1);
		await page.getByRole('textbox', { name: 'requiredNestedString' }).fill('nested string');
		await expect(form.getByText("must have required property 'requiredObject'")).toHaveCount(0);

		await expect(form.getByText("must have required property 'referencedRequiredNestedObject'")).toHaveCount(1);
		await page.getByLabel('Required Min', { exact: true }).fill('1');
		await expect(form.getByText("must have required property 'referencedRequiredNestedObject'")).toHaveCount(0);
		await page.getByLabel('Optional Max', { exact: true }).fill('5');
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
		await expect(form.getByText('Should be a number')).toHaveCount(1);
	});

	await test.step('Must be integer is validated', async () => {
		const input = form.getByLabel('exclusiveMinMaxOptionalInt', { exact: true });
		await input.fill('5.12');
		await page.getByRole('button', { name: 'Save changes' }).click();
		await expect(page.getByText('must be integer')).toHaveCount(1);
	});

	await test.step('Delete workflow task', async () => {
		await workflow.removeCurrentTask();
	});

	await test.step('Delete task', async () => {
		await deleteTask(page, randomTaskName);
	});
});
