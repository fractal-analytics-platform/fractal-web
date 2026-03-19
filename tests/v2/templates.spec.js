import { expect, test } from '@playwright/test';
import { addTaskToWorkflow, closeModal, createProject, createWorkflow, waitModal, waitModalClosed, waitPageLoading } from '../utils.js';
import { createDataset } from './dataset_utils.js';

test('Use template page', async ({ page }) => {
    
    const project = await createProject(page);
    const dataset = await createDataset(page, project.id);
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
        ).toHaveValue("1");
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
        await modal.getByText('Template description').fill("This is the template description.")
        await modal2.getByLabel('User Group').selectOption({ label: 'All' });
        await modal2.getByRole('button', { name: 'Create template' }).click();
        await waitPageLoading(page);

        //  Now we are at /v2/templates?template_id=1
    });

});