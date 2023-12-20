import { expect, test, waitPageLoading } from './base_test.js';

test('Create and delete a project', async ({ page }) => {
	await page.goto('/projects');
	await waitPageLoading(page);

	// Create a new project with a random name
	const randomProjectName = Math.random().toString(36).substring(7);
	const projectNameInput = page.locator('[name="projectName"]');
	await projectNameInput.fill(randomProjectName);
	await projectNameInput.blur();
	const createProjectBtn = page.getByRole('button', { name: 'Create new project' });
	await createProjectBtn.waitFor();
	await createProjectBtn.click();

	// Verify that the user is redirected to the project page
	await page.waitForURL(/\/projects\/\d+/);
	await expect(page.locator('h1:not(.modal-title)')).toHaveText(
		new RegExp('Project ' + randomProjectName + ' #\\d+')
	);

	// Go back to projects list
	await page.goto('/projects');
	await waitPageLoading(page);
	await expect(page.getByRole('cell', { name: randomProjectName })).toHaveCount(1);

	// Get project row
	const rows = await page.getByRole('row').all();
	let projectRow;
	for (const row of rows) {
		if ((await row.getByRole('cell', { name: randomProjectName }).count()) === 1) {
			projectRow = row;
			break;
		}
	}
	expect(projectRow).toBeDefined();

	// Open project info modal
	const infoBtn = /** @type {import('@playwright/test').Locator} */ (projectRow).getByRole(
		'button',
		{ name: 'Info' }
	);
	await infoBtn.click();

	// Wait info modal
	let modalTitle = page.locator('.modal.show .modal-title');
	await modalTitle.waitFor();
	await expect(modalTitle).toHaveText('Project ' + randomProjectName);
	const items = await page.locator('.modal.show .modal-body').getByRole('listitem').all();
	expect(items.length).toEqual(4);
	expect(await items[1].innerText()).toEqual(randomProjectName);
	expect(await items[3].innerText()).toEqual('No');

	let closeModalBtn = page.locator('.modal.show').getByRole('button', {name: 'Close'});
	await closeModalBtn.click();

	// Click on the delete project button related to the current project
	const deleteBtn = /** @type {import('@playwright/test').Locator} */ (projectRow).getByRole(
		'button',
		{ name: 'Delete' }
	);
	await deleteBtn.click();

	// Wait confirm action modal
	modalTitle = page.locator('.modal.show .modal-title');
	await modalTitle.waitFor();
	await expect(modalTitle).toHaveText('Confirm action');
	await expect(page.locator('.modal.show .modal-body')).toContainText(
		'Delete project ' + randomProjectName
	);

	// Confirm the deletion of the project
	await page.getByRole('button', { name: 'Confirm' }).click();

	await page.waitForFunction((projectName) => {
		const projectNames = [...document.querySelectorAll('table td:nth-child(2)')].map(
			(c) => /** @type {HTMLElement} */ (c).innerText
		);
		return !projectNames.includes(projectName);
	}, randomProjectName);
	await expect(page.getByRole('cell', { name: randomProjectName })).toHaveCount(0);
});
