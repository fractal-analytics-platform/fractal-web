import { test as baseTest, mergeTests } from '@playwright/test';
import { waitPageLoading } from '../utils.js';

export class PageWithProject {
	/**
	 * @param {import('@playwright/test').Page} page
	 */
	constructor(page) {
		this.page = page;
		this.projectName = Math.random().toString(36).substring(7);
	}

	async createProject() {
		await this.page.goto('/v2/projects');
		await waitPageLoading(this.page);

		await this.page.getByRole('button', { name: 'Create new project' }).click();

		// Wait modal opening
		let modalTitle = this.page.locator('.modal.show .modal-title');
		await modalTitle.waitFor();
		await expect(modalTitle).toHaveText('Create new project');

		// Fill form and submit
		const projectNameInput = this.page.getByLabel('Project name');
		await projectNameInput.fill(this.projectName);
		const createProjectBtn = this.page
			.locator('.modal.show')
			.getByRole('button', { name: 'Create' });
		await createProjectBtn.click();

		// Verify that the user is redirected to the project page
		await this.page.waitForURL(/\/v2\/projects\/\d+/);
		this.url = this.page.url();
		const match = this.url.match(/\/v2\/projects\/(\d+)/);
		if (match) {
			this.projectId = match[1];
		}
	}

	async deleteProject() {
		await this.page.goto('/v2/projects');
		await waitPageLoading(this.page);
		const rows = await this.page.getByRole('row').all();
		for (const row of rows) {
			if ((await row.getByRole('cell', { name: this.projectName }).count()) === 1) {
				const deleteBtn = row.getByRole('button', { name: 'Delete' });
				await deleteBtn.click();
				break;
			}
		}

		await this.page.getByRole('button', { name: 'Confirm' }).click();

		await this.page.waitForFunction((projectName) => {
			const projectNames = [...document.querySelectorAll('table td:nth-child(1)')].map(
				(c) => /** @type {HTMLElement} */ (c).innerText
			);
			return !projectNames.includes(projectName);
		}, this.projectName);
		await expect(this.page.getByRole('cell', { name: this.projectName })).toHaveCount(0);
	}
}

const projectTest = baseTest.extend({
	project: async ({ page }, use) => {
		const project = new PageWithProject(page);
		await project.createProject();
		await use(project);
		await project.deleteProject();
	}
});

export const test = mergeTests(baseTest, projectTest);
export const expect = test.expect;
