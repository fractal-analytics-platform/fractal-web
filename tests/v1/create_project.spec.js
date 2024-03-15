import { expect, test } from '@playwright/test';
import { waitPageLoading } from '../utils.js';

test('Create and delete a project', async ({ page }) => {
	await page.goto('/v1/projects');
	await waitPageLoading(page);

	const randomProjectName = Math.random().toString(36).substring(7);

	await test.step('Create a new project', async () => {
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
		await page.waitForURL(/\/v1\/projects\/\d+/);
		await expect(page.locator('h1:not(.modal-title)')).toHaveText(
			new RegExp('Project ' + randomProjectName + ' #\\d+')
		);
	});

	await test.step('Verify that new project is visible in projects page', async () => {
		// Go back to projects list
		await page.goto('/v1/projects');
		await waitPageLoading(page);
		await expect(page.getByRole('cell', { name: randomProjectName })).toHaveCount(1);

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
		const items = await page.locator('.modal.show .modal-body').getByRole('listitem').all();
		expect(items.length).toEqual(4);
		expect(await items[1].innerText()).toEqual(randomProjectName);
		expect(await items[3].innerText()).toEqual('No');

		let closeModalBtn = page.locator('.modal.show').getByRole('button', { name: 'Close' });
		await closeModalBtn.click();
	});

	await test.step('Search the project', async () => {
		await page.getByPlaceholder('Search').fill(randomProjectName);
		expect(await page.getByRole('row').count()).toEqual(2);

		await page.getByPlaceholder('Search').fill(`${randomProjectName}-foo`);
		expect(await page.getByRole('row').count()).toEqual(1);

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

	await test.step('Delete project', async () => {
		const projectRow = await getProjectRow(page, randomProjectName);

		// Click on the delete project button related to the current project
		const deleteBtn = /** @type {import('@playwright/test').Locator} */ (projectRow).getByRole(
			'button',
			{ name: 'Delete' }
		);
		await deleteBtn.click();

		// Wait confirm action modal
		let modalTitle = page.locator('.modal.show .modal-title');
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
