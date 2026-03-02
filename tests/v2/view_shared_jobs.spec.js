import { expect, test } from '@playwright/test';
import {
	addTaskToWorkflow,
	createProject,
	createWorkflow,
	deleteProject,
	login,
	logout,
	selectSlimSelect,
	shareProjectById,
	waitModal,
	waitPageLoading
} from '../utils.js';
import { createTestUser } from './user_utils.js';
import { createDataset } from './dataset_utils.js';
import { waitTaskSubmitted } from './workflow_task_utils.js';

// Reset storage state for this file to avoid being authenticated
test.use({ storageState: { cookies: [], origins: [] } });

test('View shared jobs', async ({ page }) => {
	await login(page, 'admin@fractal.xy', '1234');
	await waitPageLoading(page);

	const userEmail = await createTestUser(page);

	const project = await createProject(page);

	await shareProjectById(page, Number(project.id), userEmail, 'Read, Write, Execute');

	const dataset = await createDataset(page, project.id);
	const workflow = await createWorkflow(page, project.id);

	await test.step('Run job', async () => {
		await addTaskToWorkflow(page, 'generic_task_converter');
		await page.getByRole('button', { name: 'Run workflow' }).click();
		const modal = await waitModal(page);
		await modal.getByRole('button', { name: 'Run' }).click();
		await modal.getByRole('button', { name: 'Confirm' }).click();
		await waitTaskSubmitted(page);
	});

	await test.step('Login as other user and accept project', async () => {
		await logout(page, 'admin@fractal.xy');
		await login(page, userEmail, 'test');
		await page.getByRole('button', { name: 'Accept' }).click();
		await expect(page.getByRole('button', { name: 'Accept' })).not.toBeVisible();
	});

	await test.step('Create new dataset and run another job', async () => {
		const dataset = await createDataset(page, project.id);
		await page.getByRole('link', { name: workflow.name }).click();
		await waitPageLoading(page);
		await page.getByRole('combobox', { name: 'Dataset' }).selectOption(dataset.name);
		await page.getByRole('button', { name: 'Run workflow' }).click();
		const modal = await waitModal(page);
		await modal.getByRole('button', { name: 'Run' }).click();
		await modal.getByRole('button', { name: 'Confirm' }).click();
		await waitTaskSubmitted(page);
	});

	await test.step('Login as admin again', async () => {
		await logout(page, userEmail);
		await login(page, 'admin@fractal.xy', '1234');
	});

	await test.step('Check jobs page', async () => {
		await page.goto('/v2/jobs');
		await selectSlimSelect(page, page.getByRole('combobox', { name: 'Select project' }), project.name);
		await expect(page.getByRole('row')).toHaveCount(4);

		// Select dataset
		await selectSlimSelect(page, page.getByRole('combobox', { name: 'Select dataset' }), dataset.name);
		await expect(page.getByRole('row')).toHaveCount(3);
		await expect(page.getByRole('row', { name: 'admin@fractal.xy' })).toBeVisible();
		await expect(page.getByRole('row', { name: userEmail })).not.toBeVisible();

		// Deselect dataset
		await page.getByRole('combobox', { name: 'Select dataset' }).locator('.ss-deselect').click();
		await expect(page.getByRole('row')).toHaveCount(4);
		await expect(page.getByRole('row', { name: 'admin@fractal.xy' })).toBeVisible();
		await expect(page.getByRole('row', { name: userEmail })).toBeVisible();

		// Select user
		await selectSlimSelect(page, page.getByRole('combobox', { name: 'Select user' }), userEmail);
		await expect(page.getByRole('row')).toHaveCount(3);
		await expect(page.getByRole('row', { name: 'admin@fractal.xy' })).not.toBeVisible();
		await expect(page.getByRole('row', { name: userEmail })).toBeVisible();
	});

	await test.step('Cleanup', async () => {
		await deleteProject(page, project.name);
	});
});
