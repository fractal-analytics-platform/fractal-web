import { test as baseTest, mergeTests } from '@playwright/test';
import { createProject, deleteProject as _deleteProject } from '../utils/v2/project';

export class PageWithProject {
	/**
	 * @param {import('@playwright/test').Page} page
	 * @param {{name: string, id: number}} project
	 */
	constructor(page, project) {
		this.page = page;
		this.projectId = project.id;
		this.projectName = project.name;
		this.url = `/v2/projects/${project.id}`;
	}

	async deleteProject() {
		await _deleteProject(this.page, this.projectId);
	}
}

const projectTest = baseTest.extend(
	/** @type {any} */ ({
		project: async ({ page }, use) => {
			const project = await createProject(page);
			const p = new PageWithProject(page, project);
			await use(p);
			await p.deleteProject();
		}
	})
);

export const test = /** @type {any} */ (mergeTests(baseTest, projectTest));
export const expect = test.expect;
