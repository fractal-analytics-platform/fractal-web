import { test as baseTest, mergeTests } from '@playwright/test';
import { addTaskToWorkflow, createWorkflow, waitModalClosed, waitPageLoading } from '../utils.js';
import { PageWithProject } from './project_fixture.js';

export class PageWithWorkflow extends PageWithProject {
	/**
	 * @param {import('@playwright/test').Page} page
	 * @param {import('@playwright/test').APIRequestContext} request
	 */
	constructor(page, request) {
		super(page);
		this.request = request;
		this.workflowName = Math.random().toString(36).substring(7);
	}

	async createWorkflow() {
		const { url, id } = await createWorkflow(this.page, Number(this.projectId), this.workflowName);
		this.url = url;
		this.workflowId = String(id);
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
		const response = await this.request.put(`http://localhost:8080/v2/${jobId}?status=${status}`);
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
}

const workflowTest = baseTest.extend(
	/** @type {any} */ ({
		workflow: async ({ page, request }, use) => {
			const workflow = new PageWithWorkflow(page, request);
			await workflow.createProject();
			await workflow.createWorkflow();
			await use(workflow);
			await workflow.deleteProject();
		}
	})
);

export const test = /** @type {any} */ (mergeTests(baseTest, workflowTest));
export const expect = test.expect;
