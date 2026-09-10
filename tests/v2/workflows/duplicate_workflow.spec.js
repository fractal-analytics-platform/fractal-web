import { closeModal, waitModal, waitModalClosed, waitPageLoading } from '../../utils/utils.js';
import { expect, test } from '../project_fixture.js';

test('Duplicate workflow', async ({ page, project }) => {
	await page.goto(project.url);
	await waitPageLoading(page);

	const workflowPageUrlRegex = /\/v2\/projects\/\d+\/workflows\/\d+/;

	await test.step('Create workflow', async () => {
		await page.getByRole('button', { name: 'Create new workflow' }).click();
		const modal = await waitModal(page);

		// Test validation
		await modal.getByRole('textbox', { name: 'Workflow name' }).fill(' ');
		await modal.getByRole('button', { name: 'Create empty workflow' }).click();
		await expect(page.getByText('String should have at least 1 character')).toHaveClass(
			/invalid-feedback/
		);

		await modal.getByRole('textbox', { name: 'Workflow name' }).fill('myworkflow');
		await modal.getByRole('button', { name: 'Create empty workflow' }).click();
		await waitModalClosed(page);
		await page.waitForURL(workflowPageUrlRegex);
		await waitPageLoading(page);
	});

	await test.step('Duplicate workflow myworkflow', async () => {
		await page.goto(project.url);
		await waitPageLoading(page);
		await page
			.getByRole('row', { name: 'myworkflow' })
			.getByRole('button', { name: 'Duplicate' })
			.click();
		await expect(page.getByRole('row', { name: 'myworkflow_copy' })).toBeVisible();
	});

	await test.step('Duplicate workflow myworkflow_copy', async () => {
		await page.goto(project.url);
		await waitPageLoading(page);
		await page
			.getByRole('row', { name: 'myworkflow_copy' })
			.getByRole('button', { name: 'Duplicate' })
			.click();
		await expect(page.getByRole('row', { name: 'myworkflow_copy_1' })).toBeVisible();
	});

	await test.step('Duplicate workflow myworkflow_copy_1', async () => {
		await page.goto(project.url);
		await waitPageLoading(page);
		await page
			.getByRole('row', { name: 'myworkflow_copy_1' })
			.getByRole('button', { name: 'Duplicate' })
			.click();
		await expect(page.getByRole('row', { name: 'myworkflow_copy_2' })).toBeVisible();
	});

	await test.step('Test create workflow with existing name error', async () => {
		await page.getByRole('button', { name: 'Create new workflow' }).click();
		const modal = await waitModal(page);
		await modal.getByRole('textbox', { name: 'Workflow name' }).fill('myworkflow');
		await modal.getByRole('button', { name: 'Create empty workflow' }).click();
		await expect(
			page.getByText(/Workflow with name='myworkflow' and project_id=\d+ already exists/)
		).toBeVisible();
		await closeModal(page);
	});
});
