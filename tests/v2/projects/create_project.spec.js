import { expect } from '@playwright/test';
import { test } from '../../base_fixture';
import {
	closeModal,
	getRandomName,
	login,
	logout,
	waitModal,
	waitModalClosed,
	waitPageLoading
} from '../../utils/utils.js';
import { createTestUser } from '../../utils/v2/user.js';

test('Create and delete a project', async ({ page }) => {
	await page.goto('/v2/projects');
	await waitPageLoading(page);

	const nameToEdit = getRandomName();
	const firstName = getRandomName();
	const secondName = getRandomName();

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
		const modal = await waitModal(page);
		await expect(modal.locator('.modal-title')).toHaveText('Create new project');

		// Fill form and submit
		const projectNameInput = page.getByLabel('Project name');
		await projectNameInput.fill(nameToEdit);
		const projectDescriptionInput = page.getByLabel('Description');
		const shortDescription = 'This is a short description';
		await projectDescriptionInput.fill(shortDescription);
		const createProjectBtn = modal.getByRole('button', { name: 'Create' });
		await createProjectBtn.click();

		// Verify that the user is redirected to the project page
		await page.waitForURL(/\/v2\/projects\/\d+/);
		await expect(page.locator('h1:not(.modal-title)')).toHaveText(
			new RegExp('Project ' + nameToEdit + ' #\\d+')
		);
		await expect(page.getByText(shortDescription)).toBeVisible();
	});

	await test.step('Edit project name and description', async () => {
		await page.getByRole('button', { name: 'Edit project' }).click();
		const modal = await waitModal(page);

		await modal.getByLabel('Name').fill(randomProjectName);
		const longDescription =
			'This is a very long project description that should be truncated in the UI';
		await modal.getByLabel('Description').fill(longDescription);

		await modal.getByRole('button', { name: 'Save' }).click();
		await waitModalClosed(page);

		const maxDescriptionLength = 50;
		await expect(page.locator('h1:not(.modal-title)')).toHaveText(
			new RegExp('Project ' + randomProjectName + ' #\\d+')
		);
		await expect(page.getByText(longDescription)).not.toBeVisible();
		await expect(
			page.getByText(`${longDescription.substring(0, maxDescriptionLength)}...`)
		).toBeVisible();
		await page.getByRole('button', { name: 'Show more' }).click();
		await expect(page.getByText(longDescription)).toBeVisible();
		await expect(
			page.getByText(`${longDescription.substring(0, maxDescriptionLength)}...`)
		).not.toBeVisible();
		await page.getByRole('button', { name: 'Show less' }).click();
		await expect(page.getByText(longDescription)).not.toBeVisible();
		await expect(
			page.getByText(`${longDescription.substring(0, maxDescriptionLength)}...`)
		).toBeVisible();
	});

	await test.step('Verify that new project is visible in projects page', async () => {
		// Go back to projects list
		await page.goto('/v2/projects');
		await waitPageLoading(page);
		await expect(page.getByRole('cell', { name: randomProjectName })).toHaveCount(1);
		await expect(page.getByPlaceholder('Search')).toBeVisible();

		const projectRow = await getProjectRow(page, randomProjectName);

		// Open project info modal
		await projectRow.getByRole('button', { name: 'Info' }).click();

		// Wait info modal
		const modal = await waitModal(page);
		await expect(modal.locator('.modal-title')).toHaveText('Project ' + randomProjectName);
		await closeModal(page);
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
		const modal = await waitModal(page, false);
		const modalTitle = modal.locator('.modal-title');
		await expect(modalTitle).toHaveText('Create new project');

		// Fill form and submit
		const projectNameInput = page.getByLabel('Project name');
		await projectNameInput.fill(randomProjectName);
		const createProjectBtn = modal.getByRole('button', { name: 'Create' });
		await createProjectBtn.click();

		// Check validation error
		await expect(modal).toContainText(`Project name (${randomProjectName}) already in use`);

		// Close modal
		const closeModalBtn = modal.getByRole('button', { name: 'Cancel' });
		await closeModalBtn.click();
	});

	await test.step('Create a second project, assert order and add stars', async () => {
		await page.getByRole('button', { name: 'Create new project' }).click();

		// Wait modal opening
		const modal = await waitModal(page, false);
		const modalTitle = modal.locator('.modal-title');
		await expect(modalTitle).toHaveText('Create new project');

		// Fill form and submit
		const projectNameInput = page.getByLabel('Project name');
		await projectNameInput.fill(randomProjectName2);
		const createProjectBtn = modal.getByRole('button', { name: 'Create' });
		await createProjectBtn.click();

		await waitModalClosed(page);
		await page.waitForURL(/\/v2\/projects\/\d+/);

		// Go back to projects list
		await page.goto('/v2/projects');
		await waitPageLoading(page);

		let projectTable = page.getByRole('table').nth(0);

		// Initial state:
		// project2 -> not starred
		// project1 -> not starred
		await expect(projectTable.getByRole('row')).toHaveCount(3);
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

	const modal = await waitModal(page, false);
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
