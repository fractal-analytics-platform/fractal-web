import { expect, test } from '@playwright/test';
import {
	addTaskToWorkflow,
	closeModal,
	waitModal,
	waitModalClosed,
	waitPageLoading
} from '../utils/utils.js';
import path from 'path';
import os from 'os';
import fs from 'fs';
import { createProject, deleteProject } from '../utils/v2/project.js';
import { createWorkflow } from '../utils/v2/workflow.js';

test('Use template page', async ({ page }) => {
	const project = await createProject(page);
	const workflow = await createWorkflow(page, project.id);

	let workflowFileName = '';
	let templateFileName = '';
	let txtFileName = '';
	let invalidJSONFileName = '';

	await test.step('Check workflow not from templates', async () => {
		await page.goto(`/v2/projects/${project.id}/workflows/${workflow.id}`);
		await waitPageLoading(page);
		await page.getByRole('button', { name: 'Workflow properties' }).click();
		const modal = await waitModal(page);
		await expect(modal.getByText('This workflow comes from a template')).not.toBeVisible();

		await modal
			.getByRole('textbox', { name: 'Workflow description' })
			.fill('This is the workflow description');
		await modal.getByRole('button', { name: 'Save' }).click();
		await waitModalClosed(page);
	});

	await test.step('Create new template', async () => {
		await page.getByRole('button', { name: 'Create template' }).click();
		const modal = await waitModal(page);
		// default: workflow.name
		await expect(modal.getByText('Template name')).toHaveValue(workflow.name);
		// default: 1
		await expect(modal.getByText('Template version')).toHaveValue('1');
		// default workflow.description
		await expect(modal.getByText('Template description')).toHaveValue(
			'This is the workflow description'
		);
		// default: null
		await expect(modal.getByLabel('User Group')).toHaveValue('');

		// Task list is empy
		await modal.getByRole('button', { name: 'Create template' }).click();
		await expect(modal.getByText(`Workflow ${workflow.id} has empty \`task_list\`.`)).toBeVisible();
		await closeModal(page);

		// Add task to workflow

		await addTaskToWorkflow(page, 'create_ome_zarr_compound');
		await addTaskToWorkflow(page, 'cellpose_segmentation');
		await addTaskToWorkflow(page, 'MIP_compound');

		const downloadPromise = page.waitForEvent('download');
		await page.getByRole('button', { name: 'Export workflow' }).click();
		const download = await downloadPromise;
		const file = path.join(os.tmpdir(), download.suggestedFilename());
		workflowFileName = file;
		await download.saveAs(file);

		// Create template
		await page.getByRole('button', { name: 'Create template' }).click();
		const modal2 = await waitModal(page);
		await modal.getByText('Template description').fill('This is the template description.');
		await modal2.getByLabel('User Group').selectOption({ label: 'All' });
		await modal2.getByRole('button', { name: 'Create template' }).click();
		await waitPageLoading(page);
	});

	await expect(page).toHaveURL(/\/v2\/templates\?template_id=/);
	let url = new URL(page.url());
	const templateId = url.searchParams.get('template_id');

	await test.step('Check template info modal', async () => {
		await page.getByRole('button', { name: 'Info' }).click();
		const modal = await waitModal(page);

		await expect(page.locator('.list-group-item.text-bg-light')).toContainText([
			'Name',
			'Description',
			'User email',
			'Version',
			'User group',
			'Creation timestamp',
			'Last use timestamp',
			'Template ID'
		]);
		const values = page.locator('.list-group-item:not(.text-bg-light)');
		await expect(values.nth(0).locator('span')).toHaveText(workflow.name);
		await expect(values.nth(1).locator('span')).toHaveText('This is the template description.');
		await expect(values.nth(2).locator('span')).toHaveText('admin@fractal.xy');
		await expect(values.nth(3).locator('span')).toHaveText('1');
		await expect(values.nth(4).locator('span')).toHaveText('All');
		await expect(values.nth(5).locator('span')).toHaveText(
			await values.nth(6).locator('span').allInnerTexts()
		);
		await expect(values.nth(7).locator('span')).toHaveText(String(templateId));
		await modal.getByRole('button', { name: 'Close' }).click();
		await waitModalClosed(page);
	});

	const newDescription = 'New description.';

	await test.step('Edit template', async () => {
		await page.getByRole('button', { name: 'Edit' }).click();
		const modal = await waitModal(page);

		await modal.getByLabel('User Group').selectOption({ label: undefined });
		await page.getByRole('textbox', { name: 'Description' }).fill(newDescription);
		await modal.getByRole('button', { name: 'Save' }).click();
		await waitModalClosed(page);

		await page.getByRole('button', { name: 'Info' }).click();
		await waitModal(page);
		const values = page.locator('.list-group-item:not(.text-bg-light)');
		await expect(values.nth(1).locator('span')).toHaveText(newDescription);
		await expect(values.nth(4).locator('span')).toHaveText('-');

		await modal.getByRole('button', { name: 'Close' }).click();
		await waitModalClosed(page);
	});

	await test.step('Download and delete template', async () => {
		await expect(page.getByRole('row')).toHaveCount(2);
		const downloadPromise = page.waitForEvent('download');
		await page.getByRole('button', { name: 'Download' }).click();
		const download = await downloadPromise;
		const file = path.join(os.tmpdir(), download.suggestedFilename());
		templateFileName = file;
		await download.saveAs(file);

		await page.getByRole('button', { name: 'Delete' }).click();
		await waitModal(page);
		await page.getByRole('button', { name: 'Confirm' }).click();
		await waitModalClosed(page);
		await expect(page).toHaveURL(`/v2/templates?template_id=${templateId}`);
		await expect(page.getByRole('row')).toHaveCount(1);

		const applyButton = await page.getByRole('button', { name: 'Apply' });
		await expect(applyButton).toBeDisabled();
		const resetButton = await page.getByRole('button', { name: 'Reset' });
		await expect(resetButton).toBeEnabled();

		await resetButton.click();
		await waitPageLoading(page);
		await expect(page).toHaveURL(`/v2/templates`);
	});

	const newTemplateName = Math.random().toString(36).substring(7);

	await test.step('Upload templates', async () => {
		const applyButton = await page.getByRole('button', { name: 'Apply' });
		await expect(applyButton).toBeDisabled();
		const resetButton = await page.getByRole('button', { name: 'Reset' });
		await expect(resetButton).toBeDisabled();

		const nameInput = page.getByRole('textbox', { name: 'Name' });
		await expect(nameInput).toHaveValue('');
		await nameInput.fill(workflow.name);

		await expect(applyButton).toBeEnabled();
		await applyButton.click();
		await waitPageLoading(page);

		await expect(page).toHaveURL(`/v2/templates?name=${workflow.name}`);
		await expect(page.getByRole('row')).toHaveCount(1);

		await page.getByRole('button', { name: 'Import' }).click();

		txtFileName = path.join(os.tmpdir(), 'ciao.txt');
		fs.writeFile(txtFileName, 'ciao', 'utf-8', () => {});
		invalidJSONFileName = path.join(os.tmpdir(), 'invalid.json');
		fs.writeFile(invalidJSONFileName, '{"foo": "bar"}', 'utf-8', () => {});

		// test non JSON file
		await page.getByLabel('Select a file').setInputFiles(txtFileName);
		await expect(page.getByText('Invalid JSON data')).toBeVisible();
		// test invalid JSON file
		await page.getByLabel('Select a file').setInputFiles(invalidJSONFileName);
		await expect(
			page.getByText('the input file is not a Workflow nor a WorkflowTemplate')
		).toBeVisible();

		await page.getByLabel('Select a file').setInputFiles(templateFileName);
		await page.getByRole('button', { name: 'Import template' }).click();
		await waitModalClosed(page);

		await expect(page).toHaveURL(/\/v2\/templates\?template_id=/);
		await expect(page.getByRole('row')).toHaveCount(2);
		// version is not a combobox now
		await expect(
			page.getByRole('row', { name: workflow.name }).getByRole('combobox').locator('option')
		).toHaveCount(0);

		await page.getByRole('button', { name: 'Import' }).click();
		await page.getByLabel('Select a file').setInputFiles(templateFileName);
		await page.getByRole('button', { name: 'Import template' }).click();
		await expect(
			page.getByText(
				`The current user already own a workflow template with name='${workflow.name}' and version=1`
			)
		).toBeVisible();
		// test default
		await expect(page.getByRole('spinbutton', { name: 'Template version' })).toHaveValue('1');
		await expect(page.getByRole('textbox', { name: 'Template name' })).toHaveValue(workflow.name);
		await expect(page.getByRole('textbox', { name: 'Template description' })).toHaveValue(
			newDescription
		);
		// override version
		await page.getByRole('spinbutton', { name: 'Template version' }).fill('42');
		await page.getByRole('button', { name: 'Import template' }).click();
		await resetButton.click();
		await page.getByRole('textbox', { name: 'Name' }).fill(workflow.name);
		await applyButton.click();
		await expect(page.getByRole('row')).toHaveCount(2);
		await expect(
			page.getByRole('row', { name: workflow.name }).getByRole('combobox').locator('option')
		).toHaveCount(2);
		// override name
		await page.getByRole('button', { name: 'Import' }).click();
		await page.getByLabel('Select a file').setInputFiles(templateFileName);
		await page.getByRole('textbox', { name: 'Template name' }).fill(newTemplateName);
		await page.getByRole('button', { name: 'Import template' }).click();
		await expect(page).toHaveURL(/\/v2\/templates\?template_id=/);
	});

	await test.step('Create a workflow from a template', async () => {
		await page.goto(`/v2/projects/${project.id}`);
		await page.getByRole('button', { name: 'Create new workflow' }).click();
		const modal = await waitModal(page);
		await modal.getByLabel('Create from template').check();

		const rows = modal.locator('tbody tr');
		await expect(rows.first()).toBeVisible();

		const count1 = await rows.count();
		expect(count1).toBeGreaterThan(1);

		const applyButton = await modal.getByRole('button', { name: 'Apply' });
		await expect(applyButton).toBeDisabled();

		await modal.getByRole('textbox', { name: 'Name' }).nth(1).fill(newTemplateName);
		await expect(applyButton).toBeEnabled();
		await applyButton.click();

		await expect(modal.getByRole('row')).toHaveCount(2);

		await modal.getByRole('button', { name: 'Select' }).click();
		await expect(
			modal.getByText(
				`Workflow with name='${workflow.name}' and project_id=${project.id} already exists.`
			)
		).toBeVisible();
		const workflowNameInput = modal.getByRole('textbox', { name: 'Workflow name' });
		await workflowNameInput.fill(Math.random().toString(36).substring(7));
		await workflowNameInput.blur();
		await modal.getByRole('button', { name: 'Select' }).click();

		await page.getByRole('button', { name: 'Workflow properties' }).click();
		const modal2 = await waitModal(page);
		await expect(modal2.getByText('This workflow comes from a template')).toBeVisible();
		await modal2.getByRole('button', { name: 'Close' }).click();
		await waitModalClosed(page);

		await page.getByRole('button', { name: 'Create template' }).click();
		const modal3 = await waitModal(page);
		// default: originalTemplate.name
		await expect(modal3.getByText('Template name')).toHaveValue(newTemplateName);
		// default: 2
		await expect(modal3.getByText('Template version')).toHaveValue('2');
		// default originalTemplate.description
		await expect(modal3.getByText('Template description')).toHaveValue(newDescription);
		// default: null
		await expect(modal3.getByLabel('User Group')).toHaveValue('');

		await closeModal(page);
	});

	await test.step('Create a template from a exported workflow', async () => {
		await page.goto('/v2/templates');

		await page.getByRole('button', { name: 'Import' }).click();
		await page.getByLabel('Select a file').setInputFiles(workflowFileName);

		await expect(page.getByRole('spinbutton', { name: 'Template version' })).toHaveValue('');
		await expect(page.getByRole('textbox', { name: 'Template name' })).toHaveValue('');
		await expect(page.getByRole('textbox', { name: 'Template description' })).toHaveValue('');

		await expect(page.getByRole('button', { name: 'Import template' })).not.toBeEnabled();

		await page
			.getByRole('textbox', { name: 'Template name' })
			.fill(Math.random().toString(36).substring(7));
		await expect(page.getByRole('button', { name: 'Import template' })).not.toBeEnabled();

		await page.getByRole('spinbutton', { name: 'Template version' }).fill('42');
		await expect(page.getByRole('button', { name: 'Import template' })).toBeEnabled();

		await page.getByRole('button', { name: 'Import template' }).click();
		await waitModalClosed(page);
	});

	await test.step('Cleanup', async () => {
		await deleteProject(page, project.id);
		fs.rmSync(templateFileName);
		fs.rmSync(txtFileName);
		fs.rmSync(invalidJSONFileName);
		fs.rmSync(workflowFileName);
	});
});
