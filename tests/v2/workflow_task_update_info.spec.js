import { expect, test } from './workflow_fixture.js';
import { waitModal, waitModalClosed, waitPageLoading } from '../utils.js';
import { createDataset } from './dataset_utils.js';

test('Update workflow task info (alias, description)', async ({ page, workflow }) => {
  await page.waitForURL(workflow.url);
  await waitPageLoading(page);

  await test.step('Create test dataset', async () => {
    await createDataset(page, workflow.projectId);
  });

  await test.step('Open workflow page and add task', async () => {
    await page.goto(workflow.url);
    await waitPageLoading(page);
    await workflow.addTask('create_ome_zarr_compound');
    await workflow.selectTask('create_ome_zarr_compound');
  });

  await test.step('Edit workflow task alias', async () => {
    await page.getByRole('button', { name: 'Info', exact: true }).click();

    await page.getByRole('button', { name: 'Edit workflow task alias' }).click()
    await page.getByRole('textbox', { name: 'Workflow task alias' }).fill('foo');

    await page.getByRole('button', { name: 'Save', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Edit workflow task alias' })).not.toBeVisible();
    await expect(page.getByRole('button', { name: 'create_ome_zarr_compound' })).not.toBeVisible();
    await expect(page.getByRole('button', { name: 'foo' })).toBeVisible();
  });

  await test.step('Verify that alias is visible in "Run workflow" modal', async () => {
    await page.getByRole('button', { name: 'Run workflow' }).click();
    const modal = await waitModal(page);
    await modal.getByRole('combobox', { name: 'Start workflow at' }).selectOption('foo');
    await modal.getByRole('combobox', { name: '(Optional) Stop workflow early' }).selectOption('foo');
    await modal.getByRole('button', { name: 'Close' }).click();
    await waitModalClosed(page);
  });

  await test.step('Edit workflow task description', async () => {
    await page.getByRole('button', { name: 'Edit workflow task description' }).click()
    await page.getByRole('textbox', { name: 'Workflow task description' }).fill('This is the workflow task description');
    await page.getByRole('button', { name: 'Save', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Edit workflow task description' })).not.toBeVisible();
    await expect(page.getByText('This is the workflow task description')).toBeVisible();
  });
});