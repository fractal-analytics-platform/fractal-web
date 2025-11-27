import { test as baseTest, mergeTests } from '@playwright/test';
import { deleteProject as utilsDeleteProject, waitPageLoading } from '../utils.js';

export class PageWithProject {
	/**
	 * @param {import('@playwright/test').Page} page
	 */
	constructor(page) {
		this.page = page;
		this.projectName = Math.random().toString(36).substring(7);
	}

	/**
	 * @returns {Promise<string>} project id
	 */
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
		expect(match).not.toBeNull();
		if (match) {
			this.projectId = match[1];
		}
		return /** @type {string} */ (this.projectId);
	}

	async deleteProject() {
		await utilsDeleteProject(this.page, this.projectName);
	}
}

const projectTest = baseTest.extend(
	/** @type {any} */ ({
		project: async ({ page }, use) => {
			const project = new PageWithProject(page);
			await project.createProject();
			await use(project);
			await project.deleteProject();
		}
	})
);

export const test = /** @type {any} */ (mergeTests(baseTest, projectTest));
export const expect = test.expect;
