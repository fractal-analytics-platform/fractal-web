import { expect, test } from './workflow_fixture.js';
import { waitModal, waitModalClosed, waitPageLoading } from '../utils.js';

test('Update workflow name and description', async ({ page, workflow }) => {

  await page.waitForURL(workflow.url);
  await waitPageLoading(page);

  await test.step('Edit workflow name', async () => {
    await page.goto(workflow.url);
    await waitPageLoading(page);

    await expect(page.getByText(workflow.workflowName)).toBeVisible();

    await page.getByRole('button', { name: 'Edit workflow' }).click();
    const modal = await waitModal(page);

    // Attempt to set empty name
    await modal.getByRole('textbox', { name: 'Workflow name' }).fill('')
    await modal.getByRole('button', { name: 'Save' }).click();
    await expect(modal.getByText('Input should be a valid string')).toBeVisible();

    // Change name
    await modal.getByRole('textbox', { name: 'Workflow name' }).fill('new_workflow_name')
    await modal.getByRole('button', { name: 'Save' }).click();
    await waitModalClosed(page);

    await expect(page.getByText(workflow.workflowName)).not.toBeVisible();
    await expect(page.getByText('new_workflow_name')).toBeVisible();
  });

  await test.step('Set workflow description', async () => {
    await page.getByRole('button', { name: 'Edit workflow' }).click();
    const modal = await waitModal(page);

    await modal.getByRole('textbox', { name: 'Workflow description' }).fill('This is the workflow description');
    await modal.getByRole('button', { name: 'Save' }).click();
    await waitModalClosed(page);

    await page.getByRole('switch', { name: 'Show description' }).click();
    await expect(page.getByText('This is the workflow description')).toBeVisible();
    await page.getByRole('switch', { name: 'Show description' }).click();
    await expect(page.getByText('This is the workflow description')).not.toBeVisible();
  });

  await test.step('Unset workflow description', async () => {
    await page.getByRole('button', { name: 'Edit workflow' }).click();
    const modal = await waitModal(page);

    await modal.getByRole('textbox', { name: 'Workflow description' }).fill('');
    await modal.getByRole('button', { name: 'Save' }).click();
    await waitModalClosed(page);

    await expect(page.getByRole('switch', { name: 'Show description' })).not.toBeVisible();
  });
});