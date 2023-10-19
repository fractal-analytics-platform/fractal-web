import { expect, test } from './base_test.js';

test('Create and delete a project', async ({ page }) => {
	await page.goto('/projects');

	const initialProjectsCount = await page.locator('table tbody tr').count();

	// Create a new project with a random name
	const randomProjectName = Math.random().toString(36).substring(7);
	await page.locator('[name="projectName"]').fill(randomProjectName);
	await page.getByRole('button', { name: 'Create new project' }).click();

	// Verify that the user is redirected to the project page
	await page.waitForURL(/\/projects\/\d+/);
	await expect(page.locator('h1:not(.modal-title)')).toHaveText(
		new RegExp('Project ' + randomProjectName + ' #\\d+')
	);

	// Go back to projects list
	await page.goto('/projects');
	await page.waitForFunction(
		(expectedCount) => document.querySelectorAll('table tbody tr').length === expectedCount,
		initialProjectsCount + 1
	);

	// Click on the last delete project button
	const deleteButtons = await page.getByRole('button', { name: 'Delete' }).all();
	expect(deleteButtons.length).toBeGreaterThan(0);
	deleteButtons[deleteButtons.length - 1].click();

	// Wait confirm action modal
	const modalTitle = page.locator('.modal.show .modal-title');
	await modalTitle.waitFor();
	await expect(modalTitle).toHaveText('Confirm action');
	await expect(page.locator('.modal.show .modal-body')).toContainText(
		'Delete project ' + randomProjectName
	);

	// Confirm the deletion of the project
	await page.getByRole('button', { name: 'Confirm' }).click();

	// Verify that the number of projects goes back to the initial count
	await page.waitForFunction(
		(expectedCount) => document.querySelectorAll('table tbody tr').length === expectedCount,
		initialProjectsCount
	);
});
