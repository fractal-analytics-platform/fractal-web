import { test as baseTest, mergeTests } from '@playwright/test';
import { waitModalClosed, waitPageLoading } from '../utils.js';
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

	async triggerTaskSuccess() {
		await this.setTaskStatus('done');
	}

	async triggerTaskFailure() {
		await this.setTaskStatus('failed');
	}

	/**
	 * @param {import('$lib/types.js').JobStatus} status
	 */
	async setTaskStatus(status) {
		const response = await this.request.put(`http://localhost:8080/${status}`);
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
	 * @returns {Promise<void>}
	 */
	async addUserTask(taskName) {
		await this.page.getByRole('button', { name: 'Add task to workflow' }).click();
		const modal = this.page.locator('.modal.show');
		await modal.waitFor();
		await this.page.getByText('User tasks').click();
		const selector = modal.getByRole('combobox').first();
		await selector.click();
		const items = await this.page.getByRole('option').all();
		let testTaskItem = null;
		for (const item of items) {
			const itemText = await item.innerText();
			if (itemText.includes(taskName)) {
				testTaskItem = item;
				break;
			}
		}
		expect(testTaskItem).not.toBeNull();
		await /** @type {import('@playwright/test').Locator} */ (testTaskItem).click();
		await this.page.locator('#taskId').waitFor();
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
