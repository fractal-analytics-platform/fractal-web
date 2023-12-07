import { expect, test } from './base_test.js';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test('Add single tasks', async ({ page }) => {
	await page.goto('/tasks');

	await test.step('Open "Add a single task" accordion', async () => {
		const addTaskAccordion = page.getByRole('button', {
			name: 'Add a single task'
		});
		await addTaskAccordion.click();
	});

	const createBtn = page.getByRole('button', { name: /^Create$/ });

	await test.step('Test required fields', async () => {
		await createBtn.click();
		await page.getByText('field required').first().waitFor();
		expect(await page.getByText('field required').count()).toEqual(5);
	});

	const randomTaskName = Math.random().toString(36).substring(7);

	await test.step('Test successful creation with required fields', async () => {
		await page.getByRole('textbox', { name: 'Task name' }).fill(randomTaskName);
		await page.getByRole('textbox', { name: 'Command' }).fill('/tmp/test');
		await page.getByRole('textbox', { name: 'Source' }).fill(`${randomTaskName}-source`);
		await page.getByRole('textbox', { name: 'Input Type' }).fill('image');
		await page.getByRole('textbox', { name: 'Output Type' }).fill('zarr');

		await createBtn.click();
		expect(await page.getByText('field required').count()).toEqual(0);
		await page.getByText('Task created successfully').waitFor();
	});

	await test.step('Test task source already in use', async () => {
		await createBtn.click();
		await page
			.getByText(`Task source \\"admin:${randomTaskName}-source\\" already in use`)
			.waitFor();
	});

	await page.getByRole('textbox', { name: 'Source' }).fill(`${randomTaskName}-source2`);

	await test.step('Test args_schema with invalid JSON', async () => {
		const fileChooserPromise = page.waitForEvent('filechooser');
		await page.getByText('Upload args schema').click();
		const fileChooser = await fileChooserPromise;
		await fileChooser.setFiles(path.join(__dirname, 'data', 'broken.json'));
		await createBtn.click();
		expect(await page.getByText("File doesn't contain valid JSON").count()).toEqual(1);
		await page.getByRole('button', { name: 'Clear' }).click();
	});

	await test.step('Test args_schema with invalid schema', async () => {
		const fileChooserPromise = page.waitForEvent('filechooser');
		await page.getByText('Upload args schema').click();
		const fileChooser = await fileChooserPromise;
		await fileChooser.setFiles(path.join(__dirname, 'data', 'invalid-schema.json'));
		await createBtn.click();
		expect(
			await page
				.getByText('File doesn\'t contain valid JSON Schema: strict mode: unknown keyword: "foo"')
				.count()
		).toEqual(1);
		await page.getByRole('button', { name: 'Clear' }).click();
	});

	await test.step('Test valid args_schema', async () => {
		const fileChooserPromise = page.waitForEvent('filechooser');
		await page.getByText('Upload args schema').click();
		const fileChooser = await fileChooserPromise;
		await fileChooser.setFiles(path.join(__dirname, 'data', 'create-ome-zarr-schema.json'));
		await createBtn.click();
		await page.getByText('Task created successfully').waitFor();
	});
});
