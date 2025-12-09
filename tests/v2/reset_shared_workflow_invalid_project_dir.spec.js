import {
	addTaskToWorkflow,
	closeModal,
	createProject,
	createWorkflow,
	deleteProject,
	login,
	logout,
	shareProjectById,
	waitModal,
	waitModalClosed,
	waitPageLoading
} from '../utils.js';
import { createDataset } from './dataset_utils.js';
import { createTestUser } from './user_utils.js';
import { expect, test } from '@playwright/test';
import { waitTaskSubmitted, waitTasksSuccess } from './workflow_task_utils.js';

// Reset storage state for this file to avoid being authenticated
test.use({ storageState: { cookies: [], origins: [] } });

test('Reset shared workflow with non-shared project directory', async ({ page }) => {
	await login(page, 'admin@fractal.xy', '1234');
	await waitPageLoading(page);

	const project = await createProject(page);
	await createDataset(page, project.id);
	const workflow = await createWorkflow(page, project.id);

	await test.step('Go to workflow page and add generic_task', async () => {
		await page.goto(workflow.url);
		await waitPageLoading(page);
		await addTaskToWorkflow(page, 'generic_task_converter');
	});

	await test.step('Start the job', async () => {
		await page.getByRole('button', { name: 'Run workflow' }).click();
		const modal = page.locator('.modal.show');
		await modal.waitFor();
		await page.getByRole('button', { name: 'Run', exact: true }).click();
		await page.getByRole('button', { name: 'Confirm' }).click();
		await waitModalClosed(page);
	});

	await test.step('Wait tasks submitted', async () => {
		await waitTaskSubmitted(page);
	});

	await test.step('Wait task success', async () => {
		await waitTasksSuccess(page);
	});

	const userEmail = await createTestUser(page, '/foo');
	await shareProjectById(page, Number(project.id), userEmail, 'Read, Write, Execute');

	await test.step('Login as other user and accept project', async () => {
		await logout(page, 'admin@fractal.xy');
		await login(page, userEmail, 'test');
		await expect(page.locator('.alert')).toHaveCount(1);
		const alert1 = page.locator('.alert');
		await alert1.getByRole('button', { name: 'Accept' }).click();
		await expect(page.locator('.alert')).toHaveCount(0);
	});

	await test.step('Attempt to reset workflow and check error message', async () => {
		await page.goto(`/v2/projects/${project.id}/workflows/${workflow.id}`);
		await waitPageLoading(page);
		await page.getByRole('button', { name: 'Reset workflow' }).click();
		const modal = await waitModal(page);
		await modal.getByRole('button', { name: 'Run' }).click();
		await modal.getByRole('button', { name: 'Confirm' }).click();
		await expect(modal.getByText(/You cannot reset dataset/)).toBeVisible();
		await closeModal(page);
	});

	await test.step('Cleanup', async () => {
		await logout(page, userEmail);
		await login(page, 'admin@fractal.xy', '1234');
		await deleteProject(page, project.name);
	});
});
