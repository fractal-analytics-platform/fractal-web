import { test as baseTest, mergeTests } from '@playwright/test';
import { selectSlimSelect, waitModalClosed, waitPageLoading } from '../utils.js';
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
		await this.page.goto('/v2/projects/' + this.projectId);
		await waitPageLoading(this.page);
		const createWorkflowBtn = this.page.getByRole('button', { name: 'Create new workflow' });
		await createWorkflowBtn.waitFor();
		await createWorkflowBtn.click();
		const modalTitle = this.page.locator('.modal.show .modal-title');
		await modalTitle.waitFor();
		await expect(modalTitle).toHaveText('Create new workflow');
		const workflowNameInput = this.page.getByRole('textbox', { name: 'Workflow name' });
		await workflowNameInput.fill(this.workflowName);
		await workflowNameInput.blur();
		const createNewWorkflowBtn = this.page.getByRole('button', { name: 'Create empty workflow' });
		await createNewWorkflowBtn.click();
		await this.page.waitForURL(/\/v2\/projects\/\d+\/workflows\/\d+/);
		this.url = this.page.url();
		const match = this.url.match(/\/v2\/projects\/\d+\/workflows\/(\d+)/);
		if (match) {
			this.workflowId = match[1];
		}
		await waitPageLoading(this.page);
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
		await this.addUserTask('Fake Task');
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
	 * @param {import('$lib/types.js').JobStatus} status
	 */
	async setTaskStatus(jobId, status) {
		const response = await this.request.put(`http://localhost:8080/v2/${jobId}?status=${status}`);
		expect(response.ok()).toEqual(true);
	}

	/**
	 * @param {string} taskName
	 */
	async selectTask(taskName) {
		await this.page.getByText(taskName).first().click();
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
	 * @returns {Promise<void>}
	 */
	async addCollectedTask(taskName, taskVersion = null) {
		await this.page.getByRole('button', { name: 'Add task to workflow' }).click();
		const modal = this.page.locator('.modal.show');
		await modal.waitFor();
		await expect(modal.locator('.spinner-border')).toHaveCount(0);
		await this.page.getByText('Common tasks').click();
		await this.addTask(modal, taskName, taskVersion);
	}

	/**
	 * @param {string} taskName
	 * @param {string|null=} taskVersion
	 * @returns {Promise<void>}
	 */
	async addUserTask(taskName, taskVersion = null) {
		await this.page.getByRole('button', { name: 'Add task to workflow' }).click();
		const modal = this.page.locator('.modal.show');
		await modal.waitFor();
		await expect(modal.locator('.spinner-border')).toHaveCount(0);
		await this.page.getByText('User tasks').click();
		await this.addTask(modal, taskName, taskVersion);
	}

	/**
	 * @param {import('@playwright/test').Locator} modal
	 * @param {string} taskName
	 * @param {string|null} taskVersion
	 */
	async addTask(modal, taskName, taskVersion) {
		const selector = modal.getByRole('combobox').first();
		await selectSlimSelect(this.page, selector, taskName);
		await this.page.locator('#taskId').waitFor();
		if (taskVersion) {
			await this.page
				.getByRole('combobox', { name: 'Select task version' })
				.selectOption(taskVersion);
		}
		await this.page.getByRole('button', { name: 'Insert' }).click();
		await waitModalClosed(this.page);
	}

	async removeCurrentTask() {
		await this.page.getByRole('button', { name: 'Delete workflow task' }).click();
		const modal = this.page.locator('.modal.show');
		await modal.waitFor();
		await modal.getByRole('button', { name: 'Confirm' }).click();
		await waitModalClosed(this.page);
	}
}

const workflowTest = baseTest.extend({
	workflow: async ({ page, request }, use) => {
		const workflow = new PageWithWorkflow(page, request);
		await workflow.createProject();
		await workflow.createWorkflow();
		await use(workflow);
		await workflow.deleteProject();
	}
});

export const test = mergeTests(baseTest, workflowTest);
export const expect = test.expect;
