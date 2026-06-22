import { mergeTests } from '@playwright/test';
import { test as baseTest } from '../base_fixture';
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

/**
 * @typedef {Object} ProjectFixture
 * @property {(params: { page: any }, use: any) => Promise<void>} project
 */

/**
 * @type {import('@playwright/test').TestType<
 *   import('@playwright/test').PlaywrightTestArgs & import('@playwright/test').PlaywrightTestOptions &
 *     { project: PageWithProject },
 *   import('@playwright/test').PlaywrightWorkerArgs & import('@playwright/test').PlaywrightWorkerOptions
 * >}
 */
const projectTest = baseTest.extend(
	/** @type {ProjectFixture} */ ({
		project: async ({ page }, use) => {
			const project = await createProject(page);
			const p = new PageWithProject(page, project);
			await use(p);
			await p.deleteProject();
		}
	})
);

export const test = mergeTests(baseTest, projectTest);
export const expect = test.expect;
