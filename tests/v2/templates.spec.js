import { expect, test } from '@playwright/test';
import { addTaskToWorkflow, closeModal, createProject, createWorkflow, waitModal, waitModalClosed, waitPageLoading } from '../utils.js';
import path from 'path';
import os from 'os';
import fs from 'fs';

test('Use template page', async ({ page }) => {
    
    const project = await createProject(page);
    const workflow = await createWorkflow(page, project.id);

    await test.step('Check workflow not from templates', async () => {
        await page.getByRole('button', { name: 'Workflow properties' }).click();
        const modal = await waitModal(page);
        // FIXME: the test below is not really working
        await expect(
            modal.getByText('This workflow comes from a template')
        ).toHaveCount(0);

        await modal.getByRole(
            'textbox', { name: 'Workflow description' }
        ).fill('This is the workflow description');
        await modal.getByRole('button', { name: 'Save' }).click();
        await waitModalClosed(page);
    });

    await test.step('Create new template', async () => {
        await page.getByRole('button', { name: 'Create template' }).click();
        const modal = await waitModal(page);
        // default: workflow.name
        await expect(
            modal.getByText('Template name')
        ).toHaveValue(workflow.name);
        // default: 1
        await expect(
            modal.getByText('Template version')
        ).toHaveValue('1');
        // default workflow.description
        await expect(
            modal.getByText('Template description')
        ).toHaveValue('This is the workflow description');
        // default: null
        await expect(modal.getByLabel('User Group')).toHaveValue('');
        
        // Task list is empy
        await modal.getByRole('button', { name: 'Create template' }).click();
        await expect(
            modal.getByText(`Workflow ${workflow.id} has empty \`task_list\`.`)
        ).toBeVisible();
        await closeModal(page)

        // Add task to workflow
        
        await addTaskToWorkflow(page, 'create_ome_zarr_compound');
		await addTaskToWorkflow(page, 'cellpose_segmentation');
		await addTaskToWorkflow(page, 'MIP_compound');

        // Create template
        await page.getByRole('button', { name: 'Create template' }).click();
        const modal2 = await waitModal(page);
        await modal.getByText('Template description').fill('This is the template description.')
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

        await expect(page.locator('.list-group-item.text-bg-light')).toContainText(
            [
                'Template ID',
                'User email',
                'Name',
                'Version',
                'User group',
                'Description',
                'Creation timestamp',
                'Last use timestamp'
            ]
        );
        const values = page.locator('.list-group-item:not(.text-bg-light)');
        await expect(values.nth(0).locator('span')).toHaveText(String(templateId));
        await expect(values.nth(1).locator('span')).toHaveText('admin@fractal.xy');
        await expect(values.nth(2).locator('span')).toHaveText(workflow.name);
        await expect(values.nth(3).locator('span')).toHaveText('1');
        await expect(values.nth(4).locator('span')).toHaveText('All');
        await expect(values.nth(5).locator('span')).toHaveText('This is the template description.');
        await expect(values.nth(6).locator('span')).toHaveText(
            await values.nth(7).locator('span').allInnerTexts()
        );
        await modal.getByRole('button', { name: 'Close' }).click();
        await waitModalClosed(page);
    });

    await test.step('Edit template', async () => {

        await page.getByRole('button', { name: 'Edit' }).click();
        const modal = await waitModal(page);

        await modal.getByLabel('User Group').selectOption({ label: undefined });
        await page.getByRole('textbox', { name: 'Description' }).fill('New description.');
        await modal.getByRole('button', { name: 'Save' }).click();
        await waitModalClosed(page);

        await page.getByRole('button', { name: 'Info' }).click();
        await waitModal(page);
        const values = page.locator('.list-group-item:not(.text-bg-light)');
        await expect(values.nth(4).locator('span')).toHaveText('-');
        await expect(values.nth(5).locator('span')).toHaveText('New description.');

        await modal.getByRole('button', { name: 'Close' }).click();
        await waitModalClosed(page);
    });

    let fileName;

    await test.step('Download and delete template', async () => {
        const rows = page.locator('tbody tr');
        await expect(await rows.count()).toBe(1)

        const downloadPromise = page.waitForEvent('download');
        await page.getByRole('button', { name: 'Download' }).click();
        const download = await downloadPromise;
        const file = path.join(os.tmpdir(), download.suggestedFilename());
        fileName = file;
        await download.saveAs(file);

        await page.getByRole('button', { name: 'Delete' }).click();
        await waitModal(page);
        await page.getByRole('button', { name: 'Confirm' }).click();
        await waitModalClosed(page);
        await expect(page).toHaveURL(`/v2/templates?template_id=${templateId}`);
        await expect(await rows.count()).toBe(0)

        const applyButton = await page.getByRole('button', { name: 'Apply' });
        await expect(applyButton).toBeDisabled();
        const resetButton = await page.getByRole('button', { name: 'Reset' });
        await expect(resetButton).toBeEnabled();
        
        await resetButton.click()
        await waitPageLoading(page);
        await expect(page).toHaveURL(`/v2/templates`);
    });

    await test.step('Upload templates', async () => {

        const applyButton = await page.getByRole('button', { name: 'Apply' });
        await expect(applyButton).toBeDisabled();
        const resetButton = await page.getByRole('button', { name: 'Reset' });
        await expect(resetButton).toBeDisabled();
        
        const nameInput = page.locator('#searchTemplateName');
        await expect(nameInput).toHaveValue('');
        await nameInput.fill(workflow.name);
        await expect(applyButton).toBeEnabled();
        await applyButton.click()
        await waitPageLoading(page);

        await expect(page).toHaveURL(`/v2/templates?name=${workflow.name}`);
        await expect(page.locator('tbody tr')).toHaveCount(0);

        await page.getByRole('button', { name: 'Import' }).click();
        await page.locator('input#templateFile').setInputFiles(fileName);
        await page.getByRole('button', { name: 'Import template' }).click();
        await waitModalClosed(page);
        
        await expect(page).toHaveURL(/\/v2\/templates\?template_id=/);
        await expect(page.locator('tbody tr')).toHaveCount(1);
        // version is not a combobox now
        await expect(
            page.locator('tr', { hasText: workflow.name })
            .getByRole('combobox').locator('option')
        ).toHaveCount(0);

        await page.getByRole('button', { name: 'Import' }).click();
        await page.locator('input#templateFile').setInputFiles(fileName);
        await page.getByRole('button', { name: 'Import template' }).click();
        await expect(page.getByText(
            `The current user already own a workflow template with name='${workflow.name}' and version=1`
        )).toBeVisible();
        // override version
        await page.locator('#templateVersion').fill("42");
        await page.getByRole('button', { name: 'Import template' }).click();
        await resetButton.click()
        await page.locator('input#searchTemplateName').fill(workflow.name)
        await applyButton.click()
        await expect(page.locator('table tbody tr')).toHaveCount(1);
        await expect(
            page.locator('tr', { hasText: workflow.name })
            .getByRole('combobox').locator('option')
        ).toHaveCount(2);
        // override name
        await page.getByRole('button', { name: 'Import' }).click();
        await page.locator('input#templateFile').setInputFiles(fileName);
        const newName = Math.random().toString(36).substring(7);
        await page.locator('#templateName').fill(newName);
        await page.getByRole('button', { name: 'Import template' }).click();
        await expect(page).toHaveURL(/\/v2\/templates\?template_id=/);
        fs.rmSync(fileName);
    });

});