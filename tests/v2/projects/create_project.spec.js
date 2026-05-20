import { expect, test } from '@playwright/test';
import { login, logout, waitPageLoading } from '../../utils/utils.js';
import { createTestUser } from '../../utils/v2/user.js';

test('Create and delete a project', async ({ page }) => {
	await page.goto('/v2/projects');
	await waitPageLoading(page);

	const firstName = Math.random().toString(36).substring(7);
	const secondName = Math.random().toString(36).substring(7);

	const randomProjectName = firstName < secondName ? secondName : firstName;
	const randomProjectName2 = firstName < secondName ? firstName : secondName;

	const user = await createTestUser(page);
	await logout(page, 'admin@fractal.xy');
	await login(page, user.email, 'test');

	await test.step('Create a new project', async () => {
		await expect(page.getByText('You currently have no owned project.')).toBeVisible();
		await expect(page.getByPlaceholder('Search')).not.toBeVisible();

		await page.getByRole('button', { name: 'Create new project' }).click();

		// Wait modal opening
		let modalTitle = page.locator('.modal.show .modal-title');
		await modalTitle.waitFor();
		await expect(modalTitle).toHaveText('Create new project');

		// Fill form and submit
		const projectNameInput = page.getByLabel('Project name');
		await projectNameInput.fill(randomProjectName);
		const createProjectBtn = page.locator('.modal.show').getByRole('button', { name: 'Create' });
		await createProjectBtn.click();

		// Verify that the user is redirected to the project page
		await page.waitForURL(/\/v2\/projects\/\d+/);
		await expect(page.locator('h1:not(.modal-title)')).toHaveText(
			new RegExp('Project ' + randomProjectName + ' #\\d+')
		);
	});

	await test.step('Verify that new project is visible in projects page', async () => {
		// Go back to projects list
		await page.goto('/v2/projects');
		await waitPageLoading(page);
		await expect(page.getByRole('cell', { name: randomProjectName })).toHaveCount(1);
		await expect(page.getByPlaceholder('Search')).toBeVisible();

		const projectRow = await getProjectRow(page, randomProjectName);

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
		let closeModalBtn = page.locator('.modal.show').getByRole('button', { name: 'Close' });
		await closeModalBtn.click();
	});

	await test.step('Search the project', async () => {
		await page.getByPlaceholder('Search').fill(randomProjectName);
		await expect(page.getByRole('row')).toHaveCount(2);

		await page.getByPlaceholder('Search').fill(`${randomProjectName}-foo`);
		await expect(page.getByRole('row')).toHaveCount(1);

		await page.getByPlaceholder('Search').fill('');
	});

	await test.step('Attempt to create a project with the same name', async () => {
		await page.getByRole('button', { name: 'Create new project' }).click();

		// Wait modal opening
		let modalTitle = page.locator('.modal.show .modal-title');
		await modalTitle.waitFor();
		await expect(modalTitle).toHaveText('Create new project');

		// Fill form and submit
		const projectNameInput = page.getByLabel('Project name');
		await projectNameInput.fill(randomProjectName);
		const createProjectBtn = page.locator('.modal.show').getByRole('button', { name: 'Create' });
		await createProjectBtn.click();

		// Check validation error
		await page.waitForFunction((projectName) => {
			const invalidFeeback = document.querySelector('.modal.show .invalid-feedback');
			if (invalidFeeback instanceof HTMLElement) {
				return invalidFeeback.innerText.includes(`Project name (${projectName}) already in use`);
			}
			return false;
		}, randomProjectName);

		// Close modal
		const closeModalBtn = page.locator('.modal.show').getByRole('button', { name: 'Cancel' });
		await closeModalBtn.click();
	});

	await test.step('Create a second project, assert order and add stars', async () => {
		await page.getByRole('button', { name: 'Create new project' }).click();

		// Wait modal opening
		let modalTitle = page.locator('.modal.show .modal-title');
		await modalTitle.waitFor();
		await expect(modalTitle).toHaveText('Create new project');

		// Fill form and submit
		const projectNameInput = page.getByLabel('Project name');
		await projectNameInput.fill(randomProjectName2);
		const createProjectBtn = page.locator('.modal.show').getByRole('button', { name: 'Create' });
		await createProjectBtn.click();

		// Go back to projects list
		await page.goto('/v2/projects');
		await waitPageLoading(page);

		let projectTable = page.getByRole('table').nth(0);

		// Initial state:
		// project2 -> not starred
		// project1 -> not starred
		let projectRow1 = projectTable.getByRole('row').nth(1);
		let projectRow2 = projectTable.getByRole('row').nth(2);
		await expect(projectRow1.getByRole('cell').nth(0)).toHaveText(randomProjectName2);
		await expect(projectRow2.getByRole('cell').nth(0)).toHaveText(randomProjectName);

		let starButton1 = projectRow1
			.getByRole('cell')
			.nth(0)
			.getByRole('button', { name: 'star project' });
		let starButton2 = projectRow2
			.getByRole('cell')
			.nth(0)
			.getByRole('button', { name: 'star project' });

		await expect(starButton1.locator('i')).toHaveClass(/bi-star(?!-fill)/);
		await expect(starButton2.locator('i')).toHaveClass(/bi-star(?!-fill)/);

		// Star `randomProjectName` and reload page
		await starButton2.click();
		await expect(starButton1.locator('i')).toHaveClass(/bi-star(?!-fill)/);
		await expect(starButton2.locator('i')).toHaveClass(/bi-star-fill/);
		await page.reload();

		// After reload:
		// project1 -> starred
		// project2 -> not starred
		await expect(projectRow1.getByRole('cell').nth(0)).toHaveText(randomProjectName);
		await expect(projectRow2.getByRole('cell').nth(0)).toHaveText(randomProjectName2);
		await expect(starButton1.locator('i')).toHaveClass(/bi-star-fill/);
		await expect(starButton2.locator('i')).toHaveClass(/bi-star(?!-fill)/);

		// Untar `randomProjectName` and reload page
		await starButton1.click();
		await expect(starButton1.locator('i')).toHaveClass(/bi-star(?!-fill)/);
		await expect(starButton1.locator('i')).toHaveClass(/bi-star(?!-fill)/);
		await page.reload();

		// After reload:
		// project2 -> not starred
		// project1 -> not starred
		await expect(projectRow1.getByRole('cell').nth(0)).toHaveText(randomProjectName2);
		await expect(projectRow2.getByRole('cell').nth(0)).toHaveText(randomProjectName);
		await expect(starButton1.locator('i')).toHaveClass(/bi-star(?!-fill)/);
		await expect(starButton2.locator('i')).toHaveClass(/bi-star(?!-fill)/);
	});

	await test.step('Delete project', async () => {
		await deleteProject(page, randomProjectName);
		await deleteProject(page, randomProjectName2);
	});
});

/**
 * @param {import('@playwright/test').Page} page
 * @param {string} projectName
 * @returns {Promise<import('@playwright/test').Locator>}
 */
async function getProjectRow(page, projectName) {
	const rows = await page.getByRole('row').all();
	let projectRow;
	for (const row of rows) {
		if ((await row.getByRole('cell', { name: projectName }).count()) === 1) {
			projectRow = row;
			break;
		}
	}
	expect(projectRow).toBeDefined();
	return /** @type {import('@playwright/test').Locator} */ (projectRow);
}

/**
 * @param {import('@playwright/test').Page} page
 * @param {string} projectName
 */
async function deleteProject(page, projectName) {
	const projectRow = await getProjectRow(page, projectName);

	const deleteBtn = /** @type {import('@playwright/test').Locator} */ (projectRow).getByRole(
		'button',
		{ name: 'Delete' }
	);

	await deleteBtn.click();

	const modal = page.locator('.modal.show');
	const modalTitle = modal.locator('.modal-title');

	await modalTitle.waitFor();
	await expect(modalTitle).toHaveText('Confirm action');
	await expect(modal.locator('.modal-body')).toContainText('Delete project ' + projectName);

	await modal.getByRole('button', { name: 'Confirm' }).click();

	await page.waitForFunction((name) => {
		const projectNames = [...document.querySelectorAll('table td:nth-child(2)')].map((c) =>
			/** @type {HTMLElement} */ (c).innerText.trim()
		);

		return !projectNames.includes(name);
	}, projectName);

	await expect(page.getByRole('cell', { name: projectName })).toHaveCount(0);
}
