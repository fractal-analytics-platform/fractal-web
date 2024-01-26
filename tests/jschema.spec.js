import { waitModalClosed, waitPageLoading } from './utils.js';
import { expect, test } from './workflow_fixture.js';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test('JSON Schema validation', async ({ page, browserName, workflow }) => {
	await page.waitForURL(workflow.url);
	await waitPageLoading(page);

	await test.step('Go to "Add a single task" form', async () => {
		await page.goto('/tasks');
		await waitPageLoading(page);
		await page.getByText('Single task').click();
	});

	const randomTaskName = 'validation-test-' + Math.random().toString(36).substring(7);

	await test.step('Create test task', async () => {
		await page.getByRole('textbox', { name: 'Task name' }).fill(randomTaskName);
		await page.getByRole('textbox', { name: 'Command' }).fill('/tmp/test');
		await page.getByRole('textbox', { name: 'Source' }).fill(`${randomTaskName}-source`);
		await page.getByRole('textbox', { name: 'Input Type' }).fill('Any');
		await page.getByRole('textbox', { name: 'Output Type' }).fill('Any');
		const fileChooserPromise = page.waitForEvent('filechooser');
		await page.getByText('Upload args schema').click();
		const fileChooser = await fileChooserPromise;
		await fileChooser.setFiles(path.join(__dirname, 'data', 'test-schema.json'));
		const createBtn = page.getByRole('button', { name: /^Create$/ });
		await createBtn.click();
		expect(await page.getByText('field required').count()).toEqual(0);
		await page.getByText('Task created successfully').waitFor();
	});

	await test.step('Add task to workflow', async () => {
		await page.goto(workflow.url);
		await waitPageLoading(page);
		await page.locator('[data-bs-target="#insertTaskModal"]').click();
		const modal = page.locator('.modal.show');
		await modal.waitFor();
		await page.getByText('User tasks').click();
		const selector = modal.getByRole('combobox').first();
		await selector.click();
		const items = await page.getByRole('option').all();
		let testTaskItem = null;
		for (const item of items) {
			const itemText = await item.innerText();
			if (itemText.includes(randomTaskName)) {
				testTaskItem = item;
				break;
			}
		}
		expect(testTaskItem).not.toBeNull();
		await /** @type {import('@playwright/test').Locator} */ (testTaskItem).click();
		await page.locator('#taskId').waitFor();
		await page.getByRole('button', { name: 'Insert' }).click();
		await waitModalClosed(page);
	});

	await test.step('Open workflow task form', async () => {
		await page.getByText(`${randomTaskName} #`).first().click();
	});

	const form = page.locator('#json-schema');

	await test.step('Fill required string', async () => {
		const input = form.getByLabel('Required string', { exact: true });
		await input.fill('foo');
		await input.fill('');
		expect(form.getByText('Field is required')).toHaveCount(1);
		await input.fill('bar');
		expect(form.getByText('Field is required')).toHaveCount(0);
	});

	await test.step('Fill optional string', async () => {
		const input = form.getByLabel('Optional string', { exact: true });
		await input.fill('foo');
		await input.fill('');
		expect(form.getByText('Field is required')).toHaveCount(0);
	});

	await test.step('Select required option', async () => {
		await page.selectOption('id=property-requiredEnum', 'option1');
		await page.selectOption('id=property-requiredEnum', '');
		expect(form.getByText('Field is required')).toHaveCount(1);
		await page.selectOption('id=property-requiredEnum', 'option1');
		expect(form.getByText('Field is required')).toHaveCount(0);
	});

	await test.step('Select optional option', async () => {
		await page.selectOption('id=property-optionalEnum', 'option1');
		await page.selectOption('id=property-optionalEnum', '');
		expect(form.getByText('Field is required')).toHaveCount(0);
	});

	await test.step('Fill required integer with min and max', async () => {
		const input = form.getByLabel('minMaxRequiredInt', { exact: true });
		if (browserName === 'firefox') {
			// chrome doesn't allow to insert text inside numeric inputs
			await input.pressSequentially('foo');
			expect(form.getByText('Should be a number')).toHaveCount(1);
		}
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
		if (browserName === 'firefox') {
			// chrome doesn't allow to insert text inside numeric inputs
			await input.pressSequentially('foo');
			expect(form.getByText('Should be a number')).toHaveCount(1);
		}
		await input.fill('-7');
		expect(form.getByText('Should be greater or equal than 0')).toHaveCount(1);
		await input.fill('33');
		expect(form.getByText('Should be lower or equal than 8')).toHaveCount(1);
		await input.fill('');
		expect(form.getByText('Field is required')).toHaveCount(0);
	});

	await test.step('Fill optional integer with exclusive min and max', async () => {
		const input = form.getByLabel('exclusiveMinMaxOptionalInt', { exact: true });
		if (browserName === 'firefox') {
			// chrome doesn't allow to insert text inside numeric inputs
			await input.pressSequentially('foo');
			expect(form.getByText('Should be a number')).toHaveCount(1);
		}
		await input.fill('2');
		expect(form.getByText('Should be greater or equal than 4')).toHaveCount(1);
		await input.fill('99');
		expect(form.getByText('Should be lower or equal than 41')).toHaveCount(1);
		await input.fill('');
		expect(form.getByText('Field is required')).toHaveCount(0);
	});

	await test.step('Required boolean', async () => {
		const checkbox = form.locator('id=property-requiredBoolean');
		const label = form.locator('[for="property-requiredBoolean"]');
		expect(await checkbox.isChecked()).toEqual(false);
		expect((await label.innerText()).trim()).toEqual('null');
		await checkbox.check();
		expect(await checkbox.isChecked()).toEqual(true);
		expect((await label.innerText()).trim()).toEqual('true');
		await checkbox.uncheck();
		expect(await checkbox.isChecked()).toEqual(false);
		expect((await label.innerText()).trim()).toEqual('false');
	});

	await test.step('Required array with minItems and maxItems', async () => {
		const addBtn = form.getByRole('button', { name: 'Add argument to list' }).first();
		await addBtn.click();
		await addBtn.click();
		expect(await addBtn.isDisabled()).toEqual(true);
		// Fill items
		await form.locator('id=property-requiredArrayWithMinMaxItems###0').fill('a');
		await form.locator('id=property-requiredArrayWithMinMaxItems###1').fill('b');
		await form.locator('id=property-requiredArrayWithMinMaxItems###2').fill('c');
		await form.locator('id=property-requiredArrayWithMinMaxItems###3').fill('d');
		// Move "d" up
		await page.getByRole('button', { name: 'Move item up' }).nth(3).click();
		await page.getByRole('button', { name: 'Move item up' }).nth(2).click();
		await page.getByRole('button', { name: 'Move item up' }).nth(1).click();
		await checkFirstArray(['d', 'a', 'b', 'c']);
		// Move "d" down
		await page.getByRole('button', { name: 'Move item down' }).first().click();
		await page.getByRole('button', { name: 'Move item down' }).nth(1).click();
		await checkFirstArray(['a', 'b', 'd', 'c']);
		// Remove items
		await form.getByRole('button', { name: 'Remove' }).nth(3).click();
		expect(await addBtn.isDisabled()).toEqual(false);
		await form.getByRole('button', { name: 'Remove' }).nth(2).click();
		await checkFirstArray(['a', 'b']);
		await form.getByRole('button', { name: 'Remove' }).nth(1).click();
		await checkFirstArray(['a', '']);
	});

	/**
	 * @param {string[]} expectedValues
	 */
	async function checkFirstArray(expectedValues) {
		for (let i = 0; i < expectedValues.length; i++) {
			expect(
				await form.locator('id=property-requiredArrayWithMinMaxItems###' + i).inputValue()
			).toEqual(expectedValues[i]);
		}
	}

	await test.step('Optional array with minItems and maxItems', async () => {
		await form.getByText('optionalArrayWithMinMaxItems').first().click();
		const addBtn = form.getByRole('button', { name: 'Add argument to list' }).nth(1);
		await addBtn.click();
		await addBtn.click();
		await addBtn.click();
		expect(await addBtn.isDisabled()).toEqual(true);
		await form.locator('id=property-optionalArrayWithMinMaxItems###0').fill('a');
		await form.locator('id=property-optionalArrayWithMinMaxItems###1').fill('b');
		await form.locator('id=property-optionalArrayWithMinMaxItems###2').fill('c');
		await form.getByRole('button', { name: 'Remove' }).nth(4).click();
		expect(await addBtn.isDisabled()).toEqual(false);
		await form.getByRole('button', { name: 'Remove' }).nth(3).click();
		await form.getByRole('button', { name: 'Remove' }).nth(2).click();
		expect(form.locator('id=property-optionalArrayWithMinMaxItems###0')).toHaveCount(0);
	});

	await test.step('Object with nested properties', async() => {
		await page.locator('[id="property-requiredObject###requiredNestedString"]').fill('nested string');
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
		await form.locator('id=property-requiredArrayWithMinMaxItems###1').fill('b');
		await page.getByRole('button', { name: 'Move item up' }).nth(1).click();
		await page.getByRole('button', { name: 'Save changes' }).click();
		await page.getByText('Arguments changes saved successfully').waitFor();
		await page.reload();
		await waitPageLoading(page);
		await page.getByText(`${randomTaskName} #`).first().click();
		expect(await page.getByLabel('Required string', { exact: true }).inputValue()).toEqual('foo');
		expect(await page.getByLabel('minMaxRequiredInt', { exact: true }).inputValue()).toEqual('7');
		expect(await page.locator('id=property-requiredEnum').inputValue()).toEqual('option1');
		await checkFirstArray(['b', 'a']);
	});

	await test.step('Delete workflow task', async () => {
		await page.getByLabel('Delete workflow task').click();
		const modal = page.locator('.modal.show');
		await modal.waitFor();
		await modal.getByRole('button', { name: 'Confirm' }).click();
		await waitModalClosed(page);
	});

	await test.step('Delete task', async () => {
		await page.goto('/tasks');
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
