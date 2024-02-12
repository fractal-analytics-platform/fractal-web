import { test as baseTest, mergeTests } from '@playwright/test';
import { waitModalClosed, waitPageLoading } from './utils.js';
import { PageWithProject } from './project_fixture.js';

export class PageWithWorkflow extends PageWithProject {
	/**
	 * @param {import('@playwright/test').Page} page
	 */
	constructor(page) {
		super(page);
		this.workflowName = Math.random().toString(36).substring(7);
	}

	/**
	 * @param {string} datasetName
	 * @param {string} datasetType
	 */
	async createDataset(datasetName, datasetType) {
		const createDatasetButton = this.page.getByRole('button', { name: 'Create new dataset' });
		await createDatasetButton.click();
		const modal = this.page.locator('.modal.show');
		await modal.waitFor();
		await this.page.locator('#datasetName').fill(datasetName);
		await this.page.selectOption('#datasetType', datasetType);
		await this.page.locator('#resource-path-0').fill('/tmp');
		let saveBtn = this.page.getByRole('button', { name: 'Save' });
		await saveBtn.click();
		await modal.waitFor({ state: 'hidden' });
	}

	async createWorkflow() {
		await this.page.goto('/projects/' + this.projectId);
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
		await this.page.waitForURL(/\/projects\/\d+\/workflows\/\d+/);
		this.url = this.page.url();
		const match = this.url.match(/\/projects\/\d+\/workflows\/(\d+)/);
		if (match) {
			this.workflowId = match[1];
		}
	}

	async addFirstTask() {
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

	/**
	 * @param {string} taskName
	 * @returns {Promise<void>}
	 */
	async addTask(taskName) {
		if (!this.url) {
			return;
		}
		await this.page.goto(this.url);
		await waitPageLoading(this.page);
		await this.page.locator('[data-bs-target="#insertTaskModal"]').click();
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
}

const workflowTest = baseTest.extend({
	workflow: async ({ page }, use) => {
		const workflow = new PageWithWorkflow(page);
		await workflow.createProject();
		await workflow.createDataset('input', 'image');
		await workflow.createDataset('output', 'zarr');
		await workflow.createWorkflow();
		await use(workflow);
		await workflow.deleteProject();
	}
});

export const test = mergeTests(baseTest, workflowTest);
export const expect = test.expect;

export async function addTaskToWorkflow() {}
