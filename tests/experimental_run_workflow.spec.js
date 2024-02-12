import { waitModalClosed, waitPageLoading } from './utils.js';
import { expect, test } from './workflow_fixture.js';

test('Experimental workflow page', async ({ page, workflow }) => {
	await page.waitForURL(workflow.url);
	await waitPageLoading(page);

	await page.goto(`/projects/${workflow.projectId}/workflows/experimental/${workflow.workflowId}`);
	await waitPageLoading(page);

	await test.step('Add task to workflow', async () => {
		await workflow.addFirstTask();
	});

	await test.step('Select input and output datasets', async () => {
		const inputDropdown = page.getByRole('combobox', { name: 'Input dataset' });
		const outputDropdown = page.getByRole('combobox', { name: 'Output dataset' });
		await inputDropdown.selectOption('input');
		await outputDropdown.selectOption('output');
	});

	await test.step('Open run workflow modal', async () => {
		await page.getByRole('button', { name: 'Run workflow' }).click();
		const modal = page.locator('.modal.show');
		await modal.waitFor();
	});

	await test.step('Start the job', async () => {
		await page.getByRole('button', { name: 'Run', exact: true }).click();
		await page.getByRole('button', { name: 'Confirm' }).click();
		await waitModalClosed(page);
	});

	await test.step('Wait job failure', async () => {
		await page.locator('.job-status-icon.bi-x').waitFor();
		await page.getByText('The last job failed with the following error').waitFor();
	});

	await test.step('Open run workflow modal again', async () => {
		await page.getByRole('button', { name: 'Run workflow' }).click();
		const modal = page.locator('.modal.show');
		await modal.waitFor();
		// Check that confirm mode has been reset
		expect(await page.getByRole('button', { name: 'Run', exact: true }).isVisible()).toEqual(true);
	});
});
