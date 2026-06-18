import { mergeTests } from '@playwright/test';
import { test as baseTest } from '../base_fixture';
import { addTaskToWorkflow, waitModalClosed, waitPageLoading } from '../utils/utils.js';
import { createWorkflow, deleteWorkflow } from '../utils/v2/workflow';
import { PageWithProject } from './project_fixture.js';
import { createProject } from '../utils/v2/project.js';

export class PageWithWorkflow extends PageWithProject {
	/**
	 * @param {import('@playwright/test').Page} page
	 * @param {{name: string, id: number}} project
	 * @param {{name: string, id: number}} workflow
	 */
	constructor(page, project, workflow) {
		super(page, project);
		this.projectUrl = this.url;
		this.url = `/v2/projects/${this.projectId}/workflows/${workflow.id}`;
		this.workflowId = workflow.id;
		this.workflowName = workflow.name;
	}

	async addFirstCollectedTask() {
		await this.page.locator('[data-bs-target="#insertTaskModal"]').click();
		let modalTitle = this.page.locator('.modal.show .modal-title');
		await modalTitle.waitFor();
		await expect(modalTitle).toHaveText('New workflow task');
		const modal = this.page.locator('.modal.show');
		const selector = modal.getByRole('combobox').first();
		await selector.click();
		const firstItem = this.page.getByRole('listbox').locator('[aria-selected="false"]').first();
		await firstItem.click();
		await this.page.locator('#taskId').waitFor();
		await this.page.getByRole('button', { name: 'Insert' }).click();
	}

	async addFakeTask() {
		await this.addTask('Fake Task');
	}

	/**
	 * @param {number} jobId
	 */
	async triggerTaskSuccess(jobId) {
		await this.setTaskStatus(jobId, 'done');
	}

	/**
	 * @param {number} jobId
	 */
	async triggerTaskFailure(jobId) {
		await this.setTaskStatus(jobId, 'failed');
	}

	/**
	 * @param {number} jobId
	 * @param {import('fractal-components/types/api.js').JobStatus} status
	 */
	async setTaskStatus(jobId, status) {
		const response = await this.page.request.put(
			`http://localhost:8080/v2/${jobId}?status=${status}`
		);
		expect(response.ok()).toEqual(true);
	}

	/**
	 * @param {string} taskName
	 */
	async selectTask(taskName) {
		await this.page.getByRole('button', { name: taskName }).first().click();
	}

	async openWorkflowPage() {
		if (!this.url) {
			return;
		}
		await this.page.goto(this.url);
		await waitPageLoading(this.page);
	}

	/**
	 * @param {string} taskName
	 * @param {string|null=} taskVersion
	 */
	async addTask(taskName, taskVersion = null) {
		await addTaskToWorkflow(this.page, taskName, taskVersion);
	}

	async removeCurrentTask() {
		await this.page.getByRole('button', { name: 'Delete workflow task' }).click();
		const modal = this.page.locator('.modal.show');
		await modal.waitFor();
		await modal.getByRole('button', { name: 'Confirm' }).click();
		await waitModalClosed(this.page);
	}

	async delete() {
		await deleteWorkflow(this.page, this.projectId, this.workflowId);
	}
}

/**
 * @typedef {Object} WorkflowFixture
 * @property {(params: { page: any }, use: any) => Promise<void>} workflow
 */

/**
 * @type {import('@playwright/test').TestType<
 *   import('@playwright/test').PlaywrightTestArgs & import('@playwright/test').PlaywrightTestOptions &
 *     { workflow: PageWithWorkflow },
 *   import('@playwright/test').PlaywrightWorkerArgs & import('@playwright/test').PlaywrightWorkerOptions
 * >}
 */
const workflowTest = baseTest.extend(
	/** @type {WorkflowFixture} */ ({
		workflow: async ({ page }, use) => {
			const project = await createProject(page);
			const workflow = await createWorkflow(page, project.id);
			const p = new PageWithWorkflow(page, project, workflow);
			await use(p);
			await p.deleteProject();
		}
	})
);

export const test = mergeTests(baseTest, workflowTest);
export const expect = test.expect;
