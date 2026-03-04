import { closeModal, waitPageLoading } from '../utils.js';
import { createDataset } from './dataset_utils.js';
import { createFakeTask } from './task_utils.js';
import { expect, test } from './workflow_fixture.js';

test('Attempt to run a workflow with invalid arguments', async ({ page, workflow }) => {
  await page.waitForURL(workflow.url);
  await waitPageLoading(page);

  let nonParallelTask;
  let parallelTask;
  let compoundTask;

  await test.step('Create test tasks', async () => {
    nonParallelTask = await createFakeTask(page, {
      type: 'non_parallel',
      args_schema_non_parallel: {
        properties: {
          required_param1: { type: 'string' },
        },
        type: 'object',
        required: ['required_param1']
      },
    });
    parallelTask = await createFakeTask(page, {
      type: 'parallel',
      args_schema_parallel: {
        properties: {
          required_param2: { type: 'string' },
        },
        type: 'object',
        required: ['required_param2']
      },
    });
    compoundTask = await createFakeTask(page, {
      type: 'compound',
      args_schema_non_parallel: {
        properties: {
          required_param3: { type: 'string' },
        },
        type: 'object',
        required: ['required_param3']
      },
      args_schema_parallel: {
        properties: {
          required_param4: { type: 'string' },
        },
        type: 'object',
        required: ['required_param4']
      },
    });
  });

  await page.goto(`/v2/projects/${workflow.projectId}`);
  await waitPageLoading(page);

  const modal = page.locator('.modal.show');

  await test.step('Create test dataset', async () => {
    await createDataset(page, workflow.projectId);
  });

  await test.step('Prepare workflow', async () => {
    await page.goto(workflow.url);
    await waitPageLoading(page);
    await workflow.addTask(nonParallelTask);
    await workflow.addTask(parallelTask);
    await workflow.addTask(compoundTask);
  });

  await test.step('Set alias to second task', async () => {
    await workflow.selectTask(parallelTask);
    await page.getByRole('button', { name: 'Info', exact: true }).click();
    await page.getByRole('button', { name: 'Edit workflow task alias' }).click()
    await page.getByRole('textbox', { name: 'Workflow task alias' }).fill('my_alias');
    await page.getByRole('button', { name: 'Save', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Edit workflow task alias' })).not.toBeVisible();
    parallelTask = 'my_alias';
  });

  await test.step('Attempt to run workflow', async () => {
    await page.getByRole('button', { name: 'Run workflow' }).click();
    await modal.waitFor();
    await modal.getByRole('button', { name: 'Run', exact: true }).click();
    await expect(modal.getByText(/You cannot run submit this workflow/)).toBeVisible();
    await expect(modal.getByRole('listitem')).toHaveCount(3);
    await expect(modal.getByRole('listitem').nth(0)).toContainText(nonParallelTask);
    await expect(modal.getByRole('listitem').nth(1)).toContainText(parallelTask);
    await expect(modal.getByRole('listitem').nth(2)).toContainText(compoundTask);
    await closeModal(page);
  });

  await test.step('Fix non parallel task', async () => {
    await page.getByRole('button', { name: 'Arguments', exact: true }).click();
    await workflow.selectTask(nonParallelTask);
    await page.getByRole('textbox', { name: 'required_param1' }).fill('foo');
    await page.getByRole('button', { name: 'Save changes' }).click();
    await expect(page.getByText(/Arguments changes saved successfully/)).toBeVisible();
  });

  await test.step('Attempt to run workflow', async () => {
    await page.getByRole('button', { name: 'Run workflow' }).click();
    await modal.waitFor();
    await modal.getByRole('button', { name: 'Run', exact: true }).click();
    await expect(modal.getByText(/You cannot run submit this workflow/)).toBeVisible();
    await expect(modal.getByRole('listitem')).toHaveCount(2);
    await expect(modal.getByRole('listitem').nth(0)).toContainText(parallelTask);
    await expect(modal.getByRole('listitem').nth(1)).toContainText(compoundTask);
    await closeModal(page);
  });

  await test.step('Fix parallel task', async () => {
    await workflow.selectTask(parallelTask);
    await page.getByRole('textbox', { name: 'required_param2' }).fill('foo');
    await page.getByRole('button', { name: 'Save changes' }).click();
    await expect(page.getByText(/Arguments changes saved successfully/)).toBeVisible();
  });

  await test.step('Attempt to run workflow', async () => {
    await page.getByRole('button', { name: 'Run workflow' }).click();
    await modal.waitFor();
    await modal.getByRole('button', { name: 'Run', exact: true }).click();
    await expect(modal.getByText(/You cannot run submit this workflow/)).toBeVisible();
    await expect(modal.getByRole('listitem')).toHaveCount(1);
    await expect(modal.getByRole('listitem')).toContainText(compoundTask);
    await closeModal(page);
  });

  await test.step('Fix compound task non parallel arguments', async () => {
    await workflow.selectTask(compoundTask);
    await page.getByRole('textbox', { name: 'required_param3' }).fill('foo');
    await page.getByRole('button', { name: 'Save changes' }).click();
    await expect(page.getByText(/Arguments changes saved successfully/)).toBeVisible();
  });

  await test.step('Attempt to run workflow', async () => {
    await page.getByRole('button', { name: 'Run workflow' }).click();
    await modal.waitFor();
    await modal.getByRole('button', { name: 'Run', exact: true }).click();
    await expect(modal.getByText(/You cannot run submit this workflow/)).toBeVisible();
    await expect(modal.getByRole('listitem')).toHaveCount(1);
    await expect(modal.getByRole('listitem')).toContainText(compoundTask);
    await closeModal(page);
  });

  await test.step('Fix compound task parallel arguments', async () => {
    await workflow.selectTask(compoundTask);
    await page.getByRole('textbox', { name: 'required_param4' }).fill('foo');
    await page.getByRole('button', { name: 'Save changes' }).click();
    await expect(page.getByText(/Arguments changes saved successfully/)).toBeVisible();
  });

  await test.step('Attempt to run workflow', async () => {
    await page.getByRole('button', { name: 'Run workflow' }).click();
    await modal.waitFor();
    await modal.getByRole('button', { name: 'Run', exact: true }).click();
    await expect(modal.getByRole('button', { name: 'Confirm', exact: true })).toBeVisible();
  });
});
