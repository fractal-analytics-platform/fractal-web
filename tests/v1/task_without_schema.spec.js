import { expect, test } from './workflow_fixture.js';
import { waitModalClosed, waitPageLoading } from '../utils.js';
import path from 'path';
import fs from 'fs';
import os from 'os';

test('Create and edit arguments of a task without schema', async ({ page, workflow }) => {
	await page.waitForURL(workflow.url);
	await waitPageLoading(page);

	await test.step('Open "Add a single task" form', async () => {
		await page.goto('/v1/tasks');
		await waitPageLoading(page);
		await page.getByText('Single task').click();
	});

	const randomTaskName = Math.random().toString(36).substring(7);

	await test.step('Create new task', async () => {
		await page.getByRole('textbox', { name: 'Task name' }).fill(randomTaskName);
		await page.getByRole('textbox', { name: 'Command' }).fill('/tmp/test');
		await page.getByRole('textbox', { name: 'Source' }).fill(`${randomTaskName}-source`);
		await page.getByRole('textbox', { name: 'Input Type' }).fill('image');
		await page.getByRole('textbox', { name: 'Output Type' }).fill('zarr');

		await page.getByRole('button', { name: /^Create$/ }).click();
		expect(await page.getByText('field required').count()).toEqual(0);
		await page.getByText('Task created successfully').waitFor();
	});

	await test.step('Open workflow page', async () => {
		await workflow.openWorkflowPage();
	});

	await test.step('Add task to workflow', async () => {
		await workflow.addUserTask(randomTaskName);
	});

	await test.step('Add task to workflow again', async () => {
		await workflow.addUserTask(randomTaskName);
	});

	await test.step('Open workflow task form', async () => {
		await page.getByText(`${randomTaskName} #`).first().click();
	});

	await test.step('Add argument property', async () => {
		await page.getByText('Add property').click();
		await page.getByPlaceholder('Arg name').fill('key1');
		await page.getByPlaceholder('Argument default value').fill('value1');
		await page.getByLabel('Save argument').click();
		await page.waitForFunction(
			() => document.querySelectorAll('[aria-label="Save argument"]').length === 0
		);
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
		expect(exportedData.key1).toEqual('value1');
	});

	await test.step('Import arguments', async () => {
		fs.writeFileSync(downloadedFile, JSON.stringify({ key1: 'value1-updated', key2: 'value2' }));
		await page.getByRole('button', { name: 'Import' }).click();
		const modalTitle = page.locator('.modal.show .modal-title');
		await modalTitle.waitFor();
		const fileChooserPromise = page.waitForEvent('filechooser');
		await page.getByText('Select arguments file').click();
		const fileChooser = await fileChooserPromise;
		await fileChooser.setFiles(downloadedFile);
		await page.getByRole('button', { name: 'Confirm' }).click();
		await waitModalClosed(page);
		await verifyImportedArguments(page);
	});

	await test.step('Switch to the other task arguments form, go back to the first form and check the arguments', async () => {
		await page.getByText(`${randomTaskName} #`).nth(1).click();
		await page.getByText(`${randomTaskName} #`).nth(0).click();
		await verifyImportedArguments(page);
	});

	await test.step('Refresh the page check the arguments', async () => {
		await page.reload();
		await waitPageLoading(page);
		await page.getByText(`${randomTaskName} #`).first().click();
		await verifyImportedArguments(page);
	});
});

/**
 * @param {import('@playwright/test').Page} page
 */
async function verifyImportedArguments(page) {
	const values = await page.locator('#args-tab .list-group .list-group-item').allInnerTexts();
	expect(values[0]).toEqual('key1');
	expect(values[1]).toEqual('value1-updated');
	expect(values[2]).toEqual('key2');
	expect(values[3]).toEqual('value2');
}
