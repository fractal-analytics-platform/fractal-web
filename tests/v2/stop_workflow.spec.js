import { expect, test } from './workflow_fixture.js';
import { waitModalClosed, waitPageLoading } from '../utils.js';
import { createDataset } from './dataset_utils.js';
import { waitTaskSubmitted } from './workflow_task_utils.js';

test('Stop workflow [v2]', async ({ page, workflow }) => {
	await page.waitForURL(workflow.url);
	await waitPageLoading(page);

	await test.step('Create test dataset', async () => {
		await createDataset(page, workflow.projectId);
	});

	await test.step('Go to workflow page', async () => {
		await page.goto(workflow.url);
		await waitPageLoading(page);
	});

	await test.step('Add and select generic_task', async () => {
		await workflow.addCollectedTask('generic_task');
		await workflow.selectTask('generic_task');
	});

	await test.step('Increase task sleep time', async () => {
		await page.getByRole('spinbutton', { name: 'Sleep Time' }).fill('100');
		await page.getByRole('button', { name: 'Save changes' }).click();
		await expect(page.getByText('Arguments changes saved successfully')).toBeVisible();
	});

	await test.step('Run workflow', async () => {
		await page.getByRole('button', { name: 'Run workflow' }).click();
		const modal = page.locator('.modal.show');
		await modal.waitFor();
		await page.getByRole('button', { name: 'Run', exact: true }).click();
		await page.getByRole('button', { name: 'Confirm' }).click();
		await waitModalClosed(page);
	});

	await test.step('Wait tasks submitted', async () => {
		await waitTaskSubmitted(page, 1);
	});

	await test.step('Stop workflow', async () => {
		await page.getByRole('button', { name: 'Stop workflow' }).click();
		await expect(page.getByText(/Job failed .* likely due to an executor shutdown./)).toBeVisible();
		await expect(page.getByRole('button', { name: 'Restart workflow' })).toBeVisible();
	});
});
