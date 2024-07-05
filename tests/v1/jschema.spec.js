import { waitModalClosed, waitPageLoading } from '../utils.js';
import { expect, test } from './workflow_fixture.js';
import { fileURLToPath } from 'url';
import path from 'path';
import os from 'os';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test('JSON Schema validation', async ({ page, browserName, workflow }) => {
	await page.waitForURL(workflow.url);
	await waitPageLoading(page);

	await test.step('Go to "Add a single task" form', async () => {
		await page.goto('/v1/tasks');
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
		await fileChooser.setFiles(path.join(__dirname, '..', 'data', 'test-schema.json'));
		const createBtn = page.getByRole('button', { name: /^Create$/ });
		await createBtn.click();
		expect(await page.getByText('field required').count()).toEqual(0);
		await page.getByText('Task created successfully').waitFor();
	});

	await test.step('Add task to workflow', async () => {
		await workflow.openWorkflowPage();
		await workflow.addUserTask(randomTaskName);
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
		const switcher = page.getByRole('switch');
		expect(await switcher.isChecked()).toEqual(false);
		await switcher.check();
		expect(await switcher.isChecked()).toEqual(true);
		await switcher.uncheck();
		expect(await switcher.isChecked()).toEqual(false);
	});

	await test.step('Required array with minItems and maxItems', async () => {
		const addBtn = form.getByRole('button', { name: 'Add argument to list' }).first();
		await addBtn.click();
		await addBtn.click();
		expect(await addBtn.isDisabled()).toEqual(true);
		// Fill items
		const block = form.locator('.property-block', {
			has: page.getByText('requiredArrayWithMinMaxItems')
		});
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
		await block.getByRole('button', { name: 'Move item up' }).nth(1).click();
		await page.getByRole('button', { name: 'Save changes' }).click();
		await page.getByText('Arguments changes saved successfully').waitFor();
		await page.reload();
		await waitPageLoading(page);
		await page.getByText(`${randomTaskName} #`).first().click();
		await expect(page.getByLabel('Required string', { exact: true })).toHaveValue('foo');
		await expect(page.getByLabel('minMaxRequiredInt', { exact: true })).toHaveValue('7');
		await expect(page.getByRole('combobox', { name: 'Required enum' })).toHaveValue('option1');
		await checkFirstArray(block, ['b', 'a']);
	});

	/** @type {string} */
	let downloadedFile;

	await test.step('Export arguments', async () => {
		const exportBtn = page.getByRole('button', { name: 'Export' });
		const downloadPromise = page.waitForEvent('download');
		await exportBtn.click();
		const download = await downloadPromise;
		downloadedFile = path.resolve(os.tmpdir(), 'playwright', download.suggestedFilename());
		await download.saveAs(downloadedFile);
	});

	/** @type {object} */
	let exportedData;

	await test.step('Check exported file', async () => {
		exportedData = JSON.parse(fs.readFileSync(downloadedFile).toString());
		expect(exportedData.requiredString).toEqual('foo');
		expect(exportedData.requiredEnum).toEqual('option1');
		expect(exportedData.minMaxRequiredInt).toEqual(7);
		expect(exportedData.requiredBoolean).toEqual(false);
		expect(exportedData.requiredArrayWithMinMaxItems[0]).toEqual('b');
		expect(exportedData.requiredArrayWithMinMaxItems[1]).toEqual('a');
		expect(exportedData.requiredObject.requiredNestedString).toEqual('nested string');
		expect(exportedData.requiredObject.referencedRequiredNestedObject.requiredMin).toEqual(1);
		expect(exportedData.requiredObject.referencedRequiredNestedObject.optionalMax).toEqual(5);
	});

	await test.step('Attempt to import a file containing invalid JSON', async () => {
		await page.getByRole('button', { name: 'Import' }).click();
		const modalTitle = page.locator('.modal.show .modal-title');
		await modalTitle.waitFor();
		await expect(modalTitle).toHaveText('Import arguments');
		const fileChooserPromise = page.waitForEvent('filechooser');
		await page.getByText('Select arguments file').click();
		const fileChooser = await fileChooserPromise;
		await fileChooser.setFiles(path.join(__dirname, '..', 'data', 'broken.json'));
		await page.getByRole('button', { name: 'Confirm' }).click();
		await page.getByText("File doesn't contain valid JSON").waitFor();
		await page.getByRole('button', { name: 'Close' }).click();
		await waitModalClosed(page);
	});

	await test.step('Attempt to import a file containing invalid arguments', async () => {
		const invalidData = { ...exportedData, requiredEnum: 'invalid' };
		fs.writeFileSync(downloadedFile, JSON.stringify(invalidData));
		await page.getByRole('button', { name: 'Import' }).click();
		const modalTitle = page.locator('.modal.show .modal-title');
		await modalTitle.waitFor();
		await expect(modalTitle).toHaveText('Import arguments');
		const fileChooserPromise = page.waitForEvent('filechooser');
		await page.getByText('Select arguments file').click();
		const fileChooser = await fileChooserPromise;
		await fileChooser.setFiles(downloadedFile);
		await page.getByRole('button', { name: 'Confirm' }).click();
		await page.getByText('must be equal to one of the allowed values').waitFor();
		await page.getByRole('button', { name: 'Close' }).click();
		await waitModalClosed(page);
	});

	await test.step('Import valid file', async () => {
		const validData = {
			requiredString: 'imported',
			requiredEnum: 'option2',
			minMaxRequiredInt: 9,
			requiredBoolean: true,
			requiredArrayWithMinMaxItems: ['imported1', 'imported2'],
			requiredObject: {
				requiredNestedString: 'imported nested string',
				referencedRequiredNestedObject: { requiredMin: 2 }
			}
		};
		fs.writeFileSync(downloadedFile, JSON.stringify(validData));
		await page.getByRole('button', { name: 'Import' }).click();
		const modalTitle = page.locator('.modal.show .modal-title');
		await modalTitle.waitFor();
		const fileChooserPromise = page.waitForEvent('filechooser');
		await page.getByText('Select arguments file').click();
		const fileChooser = await fileChooserPromise;
		await fileChooser.setFiles(downloadedFile);
		await page.getByRole('button', { name: 'Confirm' }).click();
		await waitModalClosed(page);
	});

	await test.step('Check the values updated by the import', async () => {
		await expect(page.getByRole('button', { name: 'Save changes' })).toBeDisabled();
		await expect(page.getByRole('button', { name: 'Discard changes' })).toBeDisabled();
		await expect(page.getByRole('textbox', { name: 'Required string' })).toHaveValue('imported');
		await expect(page.getByRole('combobox', { name: 'Required enum' })).toHaveValue('option2');
		await expect(page.getByRole('spinbutton', { name: 'minMaxRequiredInt' })).toHaveValue('9');
		await expect(page.getByRole('switch')).toBeChecked();
		const block = form.locator('.property-block', {
			has: page.getByText('requiredArrayWithMinMaxItems')
		});
		await expect(block.getByRole('textbox').nth(0)).toHaveValue('imported1');
		await expect(block.getByRole('textbox').nth(1)).toHaveValue('imported2');
		await expect(page.getByRole('spinbutton', { name: 'Required Min' })).toHaveValue('2');
		await expect(page.getByRole('spinbutton', { name: 'Optional Max' })).toHaveValue('');
	});

	await test.step('Delete workflow task', async () => {
		await page.getByLabel('Delete workflow task').click();
		const modal = page.locator('.modal.show');
		await modal.waitFor();
		await modal.getByRole('button', { name: 'Confirm' }).click();
		await waitModalClosed(page);
	});

	await test.step('Delete task', async () => {
		await page.goto('/v1/tasks');
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
