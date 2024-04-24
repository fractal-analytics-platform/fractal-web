import { fileURLToPath } from 'url';
import { waitPageLoading } from '../utils.js';
import { expect, test } from './project_fixture.js';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test('Import workflow', async ({ page, project }) => {
	await page.waitForURL(project.url);
	await waitPageLoading(page);

	await test.step('Open "Create new workflow" modal', async () => {
		const createWorkflowBtn = page.getByRole('button', { name: 'Create new workflow' });
		await createWorkflowBtn.waitFor();
		await createWorkflowBtn.click();
		const modalTitle = page.locator('.modal.show .modal-title');
		await modalTitle.waitFor();
		await expect(modalTitle).toHaveText('Create new workflow');
		expect(await page.getByRole('button', { name: 'Create empty workflow' }).count()).toEqual(1);
	});

	let importWorkflowBtn;
	await test.step('Attempt to import workflow using invalid JSON', async () => {
		const fileChooserPromise = page.waitForEvent('filechooser');
		await page.getByText('Import workflow from file').click();
		const fileChooser = await fileChooserPromise;
		await fileChooser.setFiles(path.join(__dirname, '..', 'data', 'broken.json'));
		importWorkflowBtn = page.getByRole('button', { name: 'Import workflow' });
		await importWorkflowBtn.waitFor();
		await expect(page.getByRole('button', { name: 'Create empty workflow' })).toHaveCount(0);
		await importWorkflowBtn.click();
		expect(await page.getByText('The workflow file is not a valid JSON file').count()).toEqual(1);
	});

	await test.step('Attempt to import workflow using invalid fractal_tasks_core version', async () => {
		const fileChooserPromise = page.waitForEvent('filechooser');
		await page.getByText('Import workflow from file').click();
		const fileChooser = await fileChooserPromise;
		await fileChooser.setFiles(path.join(__dirname, '..', 'data', 'workflow_to_import.json'));
		await importWorkflowBtn.click();
		await page.getByText(/Found 0 tasks with source='pip_remote:fractal_tasks_core/).waitFor();
	});

	const randomWorkflowName1 = Math.random().toString(36).substring(7);

	await test.step('Import valid workflow overriding workflow name', async () => {
		await page.getByRole('textbox', { name: 'Workflow name' }).fill(randomWorkflowName1);
		const fileChooserPromise = page.waitForEvent('filechooser');
		await page.getByText('Import workflow from file').click();
		const fileChooser = await fileChooserPromise;
		await fileChooser.setFiles({
			name: 'valid-workflow.json',
			mimeType: 'application/json',
			buffer: Buffer.from(
				JSON.stringify({
					name: 'My Workflow',
					task_list: []
				})
			)
		});
		await importWorkflowBtn.click();
		await page.waitForURL(/\/v2\/projects\/\d+\/workflows\/\d+/);
		await waitPageLoading(page);
		expect(await page.locator('.breadcrumb-item.active').innerText()).toEqual(randomWorkflowName1);
	});

	await test.step('Go back to project page', async () => {
		await page.goto(project.url);
		await waitPageLoading(page);
	});

	await test.step('Open "Create new workflow" modal', async () => {
		const createWorkflowBtn = page.getByRole('button', { name: 'Create new workflow' });
		await createWorkflowBtn.waitFor();
		await createWorkflowBtn.click();
		const modalTitle = page.locator('.modal.show .modal-title');
		await modalTitle.waitFor();
		await expect(modalTitle).toHaveText('Create new workflow');
		expect(await page.getByRole('button', { name: 'Create empty workflow' }).count()).toEqual(1);
	});

	const randomWorkflowName2 = Math.random().toString(36).substring(7);

	await test.step('Import valid workflow without setting workflow name', async () => {
		const fileChooserPromise = page.waitForEvent('filechooser');
		await page.getByText('Import workflow from file').click();
		const fileChooser = await fileChooserPromise;
		await fileChooser.setFiles({
			name: 'valid-workflow.json',
			mimeType: 'application/json',
			buffer: Buffer.from(
				JSON.stringify({
					name: randomWorkflowName2,
					task_list: []
				})
			)
		});
		await importWorkflowBtn.click();
		await page.waitForURL(/\/v2\/projects\/\d+\/workflows\/\d+/);
		await waitPageLoading(page);
		expect(await page.locator('.breadcrumb-item.active').innerText()).toEqual(randomWorkflowName2);
	});

	await test.step('Go back to project page', async () => {
		await page.goto(project.url);
		await waitPageLoading(page);
	});

	await test.step('Filter workflows', async () => {
		const workflowTable = page.getByRole('table').nth(1).locator('tbody');
		expect(await workflowTable.getByRole('row').count()).toEqual(2);
		await page.getByPlaceholder('Search workflow').fill(randomWorkflowName1);
		expect(await workflowTable.getByRole('row').count()).toEqual(1);
		expect(await workflowTable.getByRole('row').first().innerText()).toContain(randomWorkflowName1);
		await page.getByPlaceholder('Search workflow').fill(randomWorkflowName2);
		expect(await workflowTable.getByRole('row').count()).toEqual(1);
		expect(await workflowTable.getByRole('row').first().innerText()).toContain(randomWorkflowName2);
	});
});
