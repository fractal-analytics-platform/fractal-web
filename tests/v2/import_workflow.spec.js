import { fileURLToPath } from 'url';
import { waitPageLoading, expectBooleanIcon } from '../utils.js';
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

	let importWorkflowBtn = page.getByRole('button', { name: 'Import workflow', exact: true });

	await test.step('Attempt to import workflow using invalid JSON', async () => {
		const fileChooserPromise = page.waitForEvent('filechooser');
		await page.getByText('Import workflow from file').click();
		const fileChooser = await fileChooserPromise;
		await fileChooser.setFiles(path.join(__dirname, '..', 'data', 'broken.json'));
		await importWorkflowBtn.waitFor();
		await expect(page.getByRole('button', { name: 'Create empty workflow' })).toHaveCount(0);
		await importWorkflowBtn.click();
		await expect(page.getByText('The workflow file is not a valid JSON file')).toBeVisible();
	});

	await test.step('Attempt to import workflow using invalid fractal_tasks_core version', async () => {
		const fileChooserPromise = page.waitForEvent('filechooser');
		await page.getByText('Import workflow from file').click();
		const fileChooser = await fileChooserPromise;
		await fileChooser.setFiles(path.join(__dirname, '..', 'data', 'workflow_to_import.json'));
		await importWorkflowBtn.click();
		await expect(page.getByText('No available versions')).toHaveCount(6);
		await page.getByRole('button', { name: 'Cancel', exact: true }).click();
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
		await expect(page.locator('.breadcrumb-item.active')).toContainText(randomWorkflowName1);
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
		await expect(page.getByRole('button', { name: 'Create empty workflow' })).toBeVisible();
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
		await expect(page.locator('.breadcrumb-item.active')).toContainText(randomWorkflowName2);
	});

	await test.step('Go back to project page', async () => {
		await page.goto(project.url);
		await waitPageLoading(page);
	});

	await test.step('Filter workflows', async () => {
		const workflowTable = page.getByRole('table').nth(1).locator('tbody');
		await expect(workflowTable.getByRole('row')).toHaveCount(2);
		await page.getByPlaceholder('Search workflow').fill(randomWorkflowName1);
		await expect(workflowTable.getByRole('row')).toHaveCount(1);
		await expect(workflowTable.getByRole('row').first()).toContainText(randomWorkflowName1);
		await page.getByPlaceholder('Search workflow').fill(randomWorkflowName2);
		await expect(workflowTable.getByRole('row')).toHaveCount(1);
		await expect(workflowTable.getByRole('row').first()).toContainText(randomWorkflowName2);
	});

	await test.step('Import new workflow using flexibility', async () => {
		const createWorkflowBtn = page.getByRole('button', { name: 'Create new workflow' });
		await createWorkflowBtn.waitFor();
		await createWorkflowBtn.click();

		const fileChooserPromise = page.waitForEvent('filechooser');
		await page.getByText('Import workflow from file').click();
		const fileChooser = await fileChooserPromise;
		await fileChooser.setFiles(
			path.join(__dirname, '..', 'data', 'workflow_to_import_with_flexibility.json')
		);
		await importWorkflowBtn.click();

		// not ok, no combobox
		const genericTask = page.locator('.task-to-import', {hasText: 'generic_task'});
		await genericTask.waitFor();
		await expectBooleanIcon(genericTask, false);
		await expect(genericTask.getByRole('combobox')).toHaveCount(0);
		// ok, no combobox
		const createZarrTask = page.locator('.task-to-import', {hasText: 'create_ome_zarr_compound'});
		await createZarrTask.waitFor();
		await expectBooleanIcon(createZarrTask, true);
		await expect(createZarrTask.getByRole('combobox')).toHaveCount(0);
		// not ok, yes combobox
		const illuminationTask = page.locator('.task-to-import', {hasText: 'illumination_correction_compound'});
		await illuminationTask.waitFor();
		await expectBooleanIcon(illuminationTask, false);
		await expect(illuminationTask.getByRole('combobox')).toHaveCount(1);
		await illuminationTask.getByRole('combobox').selectOption({ label: '0.0.1' });
		await expectBooleanIcon(illuminationTask, true);

		// 'Import Workflow' not clickable
		await expect(importWorkflowBtn).toBeDisabled();
		// check *Include older versions*
		await page.getByRole('checkbox', { name: 'Include older versions' }).check();
		
		// not ok, yes combobox
		await expectBooleanIcon(genericTask, false);
		await expect(genericTask.getByRole('combobox')).toHaveCount(1);
		await genericTask.getByRole('combobox').selectOption({ label: '0.0.1' });;
		await expectBooleanIcon(genericTask, true);
		// still ok
		await expectBooleanIcon(createZarrTask, true);
		// not ok, yes combobox
		await expectBooleanIcon(illuminationTask, false);
		await expect(illuminationTask.getByRole('combobox')).toHaveCount(1);
		await illuminationTask.getByRole('combobox').selectOption({ label: '0.0.1' });
		await expectBooleanIcon(illuminationTask, true);

		// 'Import Workflow' is clickable
		await expect(importWorkflowBtn).toBeEnabled();
		await importWorkflowBtn.click()
		await page.waitForURL(/\/v2\/projects\/\d+\/workflows\/\d+/);
		await waitPageLoading(page);
		await expect(page.locator('.breadcrumb-item.active')).toContainText('workflow-with-flexibility');
	});
});
