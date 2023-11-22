import { test as playwrightTest, mergeTests } from '@playwright/test';
import { test as baseTest } from './base_test.js';

export class PageWithProject {
	/**
	 * @param {import('@playwright/test').Page} page
	 */
	constructor(page) {
		this.page = page;
		this.projectName = Math.random().toString(36).substring(7);
	}

	async createProject() {
		await this.page.goto('/projects');
		const projectNameInput = this.page.locator('[name="projectName"]');
		await projectNameInput.fill(this.projectName);
		await projectNameInput.blur();
		const createProjectBtn = this.page.getByRole('button', { name: 'Create new project' });
		await createProjectBtn.waitFor();
		await createProjectBtn.click();
		await this.page.waitForURL(/\/projects\/\d+/);
		this.url = this.page.url();
		const match = this.url.match(/\/projects\/(\d+)/);
		if (match) {
			this.projectId = match[1];
		}
	}

	async deleteProject() {
		await this.page.goto('/projects');
		const rows = await this.page.getByRole('row').all();
		for (const row of rows) {
			if ((await row.getByRole('cell', { name: this.projectName }).count()) === 1) {
				const deleteBtn = row.getByRole('button', { name: 'Delete' });
				await deleteBtn.click();
			}
		}
	}
}

const projectTest = playwrightTest.extend({
	project: async ({ page }, use) => {
		const project = new PageWithProject(page);
		await project.createProject();
		await use(project);
		await project.deleteProject();
	}
});

export const test = mergeTests(baseTest, projectTest);
export const expect = test.expect;
