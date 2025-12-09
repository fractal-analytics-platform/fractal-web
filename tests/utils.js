import * as crypto from 'crypto';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { expect } from '@playwright/test';

export function generateUUID() {
	return crypto.randomBytes(16).toString('hex');
}

/**
 * Wait until page spinner disappear
 * @param {import('@playwright/test').Page} page
 */
export async function waitPageLoading(page) {
	await expect(page.locator('.loading.show')).toHaveCount(0);
}

/**
 * Close the currently opened modal
 * @param {import('@playwright/test').Page} page
 */
export async function closeModal(page) {
	const modal = page.locator('.modal.show');
	await modal.locator('.modal-header').getByRole('button', { name: 'Close' }).click();
	await expect(modal).not.toBeVisible();
}

/**
 * Wait until modal is opened
 * @param {import('@playwright/test').Page} page
 * @returns {Promise<import('@playwright/test').Locator>}
 */
export async function waitModal(page) {
	const modal = page.locator('.modal.show');
	await modal.waitFor();
	return modal;
}

/**
 * Wait until modal is closed
 * @param {import('@playwright/test').Page} page
 */
export async function waitModalClosed(page) {
	await expect(page.locator('.modal.show')).not.toBeVisible();
}

/**
 * Wait until spinner inside selected element disappears
 * @param {import('@playwright/test').Page} page
 * @param {string} selector
 */
export async function waitStopSpinnerIn(page, selector) {
	await page.waitForFunction((selector) => {
		const element = /** @type {HTMLElement} */ (document.querySelector(selector));
		return element.querySelectorAll('.spinner-border').length === 0;
	}, selector);
}

/**
 * @param {import('@playwright/test').Page} page
 * @param {string} selectorText
 * @param {string} fileName
 * @param {any} data
 * @param {string|undefined} parentFolder
 * @returns {Promise<string>} the path of the created file
 */
export async function uploadFile(page, selectorText, fileName, data, parentFolder = undefined) {
	if (!parentFolder) {
		parentFolder = os.tmpdir();
	}
	const file = path.join(parentFolder, fileName);
	fs.writeFileSync(file, JSON.stringify(data));

	const fileChooserPromise = page.waitForEvent('filechooser');
	await page.getByText(selectorText, { exact: true }).click();
	const fileChooser = await fileChooserPromise;
	await fileChooser.setFiles(file);

	return file;
}

/**
 * @param {import('@playwright/test').Page} page
 * @param {import('@playwright/test').Locator} selector
 * @param {string} optionValue
 * @param {boolean} multiple
 */
export async function selectSlimSelect(page, selector, optionValue, multiple = false) {
	await selector.click();
	const dataId = await selector.getAttribute('data-id');
	const items = await page.locator(`.ss-content[data-id="${dataId}"]`).getByRole('option').all();
	let selectedItem = null;
	for (const item of items.reverse()) {
		const itemText = await item.innerText();
		if (itemText === optionValue) {
			selectedItem = item;
			break;
		}
	}
	expect(selectedItem).not.toBeNull();
	const item = /** @type {import('@playwright/test').Locator} */ (selectedItem);
	await item.click();
	if (multiple) {
		await expect(selector).toHaveText(new RegExp(`(${optionValue}$)|(^\\d+ selected$)`));
	} else {
		await expect(selector).toHaveText(optionValue);
	}
	await expect(item).toHaveAttribute('aria-selected', 'true');
}

/**
 * @param {import('@playwright/test').Page} page
 * @param {string} label
 * @param {string} value
 * @returns {Promise<void>}
 */
export async function expectSlimSelectValue(page, label, value) {
	await expect(page.getByLabel(label).locator('.ss-single')).toHaveText(value);
}

/**
 * @param {import('@playwright/test').Page} page
 * @param {string} label
 * @returns {Promise<void>}
 */
export async function expectSlimSelectNotSet(page, label, placeholder = 'All') {
	await expect(page.getByLabel(label).locator('.ss-placeholder')).toHaveText(placeholder);
}

/**
 * @param {import('@playwright/test').Page} page
 * @param {string} email
 * @param {string} password
 */
export async function login(page, email, password) {
	await page.goto('/auth/login');
	await waitPageLoading(page);
	await page.getByRole('button', { name: 'Log in with username & password' }).click();
	await page.getByLabel('Email address').fill(email);
	await page.getByLabel('Password').fill(password);
	await page.getByRole('button', { name: 'Log in', exact: true }).click();
	await page.waitForURL('/v2/projects');
	await waitPageLoading(page);
}

/**
 * @param {import('@playwright/test').Page} page
 * @param {string} email
 */
export async function logout(page, email) {
	await page.getByRole('button', { name: email }).click();
	await page.getByRole('button', { name: 'Logout' }).click();
	await waitPageLoading(page);
	await expect(page.getByRole('link', { name: 'Login' }).first()).toBeVisible();
}

/**
 * @param {import('@playwright/test').Page} page
 * @param {string} selectorText
 * @param {string} filePath
 */
export async function setUploadFile(page, selectorText, filePath) {
	const fileChooserPromise = page.waitForEvent('filechooser');
	await page.getByText(selectorText).click();
	const fileChooser = await fileChooserPromise;
	await fileChooser.setFiles(filePath);
}

/**
 * @param {import('@playwright/test').Locator} locator
 * @param {boolean} expectedValue
 */
export async function expectBooleanIcon(locator, expectedValue) {
	const value = await locator.locator('.boolean-icon').getAttribute('aria-checked');
	expect(value).toEqual(expectedValue.toString());
}

/**
 * @param {import('@playwright/test').Page} page
 */
export async function createProject(page) {
	await page.goto('/v2/projects');
	await waitPageLoading(page);

	await page.getByRole('button', { name: 'Create new project' }).click();

	const modal = await waitModal(page);

	const projectName = Math.random().toString(36).substring(7);
	await modal.getByLabel('Project name').fill(projectName);
	const createProjectBtn = modal.getByRole('button', { name: 'Create' });
	await createProjectBtn.click();
	await waitModalClosed(page);

	await page.waitForURL(/\/v2\/projects\/\d+/);
	await waitPageLoading(page);

	let projectId = undefined;
	const match = page.url().match(/\/v2\/projects\/(\d+)/);
	if (match) {
		projectId = match[1];
	}
	expect(projectId).toBeDefined();

	return { id: /** @type {string} */ (projectId), name: projectName };
}

/**
 * @param {import('@playwright/test').Page} page
 * @param {string} projectName
 * @param {string} userEmail
 * @param {string} permissions
 */
export async function shareProjectByName(page, projectName, userEmail, permissions) {
	await page.goto('/v2/projects');
	await waitPageLoading(page);
	await page.getByRole('row', { name: projectName }).getByRole('link', { name: 'Sharing' }).click();
	await page.waitForURL(/\/v2\/projects\/\d+\/sharing/);
	await waitPageLoading(page);
	await page.getByRole('textbox', { name: 'User e-mail' }).fill(userEmail);
	await page.getByRole('combobox', { name: 'Permission' }).selectOption(permissions);
	await page.getByRole('button', { name: 'Share' }).click();
	const row = page.getByRole('row', { name: userEmail });
	await expect(row).toBeVisible();
}

/**
 * @param {import('@playwright/test').Page} page
 * @param {number} projectId
 * @param {string} userEmail
 * @param {string} permissions
 */
export async function shareProjectById(page, projectId, userEmail, permissions) {
	await page.goto(`/v2/projects/${projectId}/sharing`);
	await waitPageLoading(page);
	await page.getByRole('textbox', { name: 'User e-mail' }).fill(userEmail);
	await page.getByRole('combobox', { name: 'Permission' }).selectOption(permissions);
	await page.getByRole('button', { name: 'Share' }).click();
	const row = page.getByRole('row', { name: userEmail });
	await expect(row).toBeVisible();
}

/**
 * @param {import('@playwright/test').Page} page
 * @param {number|string} projectId
 * @param {string} workflowName
 */
export async function createWorkflow(page, projectId, workflowName = '') {
	await page.goto(`/v2/projects/${projectId}`);
	await waitPageLoading(page);
	const createWorkflowBtn = page.getByRole('button', { name: 'Create new workflow' });
	await createWorkflowBtn.waitFor();
	await createWorkflowBtn.click();
	const modal = await waitModal(page);
	const workflowNameInput = modal.getByRole('textbox', { name: 'Workflow name' });
	if (!workflowName) {
		workflowName = Math.random().toString(36).substring(7);
	}
	await workflowNameInput.fill(workflowName);
	await workflowNameInput.blur();
	await modal.getByRole('button', { name: 'Create empty workflow' }).click();
	await page.waitForURL(/\/v2\/projects\/\d+\/workflows\/\d+/);
	const url = page.url();
	const match = url.match(/\/v2\/projects\/\d+\/workflows\/(\d+)/);
	let workflowId;
	if (match) {
		workflowId = Number(match[1]);
	}
	await waitPageLoading(page);
	return { url, id: workflowId, name: workflowName };
}

/**
 * @param {import('@playwright/test').Page} page
 * @param {string} taskName
 * @param {string | null} taskVersion
 */
export async function addTaskToWorkflow(page, taskName, taskVersion = null) {
	await page.getByRole('button', { name: 'Add task to workflow' }).click();
	const modal = page.locator('.modal.show');
	await modal.waitFor();
	await expect(modal.locator('.spinner-border')).toHaveCount(0);
	const row = await getTaskRow(modal, taskName);
	await row.scrollIntoViewIfNeeded();
	if (taskVersion) {
		await row
			.getByRole('combobox', { name: `Version for task ${taskName}` })
			.selectOption(taskVersion);
	}
	await row.getByRole('button', { name: 'Add task' }).click();
	await waitModalClosed(page);
}

/**
 * @param {import('@playwright/test').Locator} modal
 * @param {string} taskName
 */
async function getTaskRow(modal, taskName) {
	const rows = await modal
		.getByRole('row', { name: taskName })
		.filter({ hasText: /Add task/ })
		.all();
	for (const row of rows) {
		const cellContent = (await row.getByRole('cell').first().innerText()).trim();
		if (cellContent === taskName) {
			return row;
		}
	}
	throw new Error(`Unable to find row for task ${taskName}`);
}

/**
 * @param {import('@playwright/test').Page} page
 * @param {string} projectName
 */
export async function deleteProject(page, projectName) {
	await page.goto('/v2/projects');
	await waitPageLoading(page);
	const rows = await page.getByRole('row').all();
	for (const row of rows) {
		if ((await row.getByRole('cell', { name: projectName }).count()) === 1) {
			const deleteBtn = row.getByRole('button', { name: 'Delete' });
			await deleteBtn.click();
			break;
		}
	}

	await page.getByRole('button', { name: 'Confirm' }).click();

	await page.waitForFunction((projectName) => {
		const projectNames = [...document.querySelectorAll('table td:nth-child(1)')].map(
			(c) => /** @type {HTMLElement} */ (c).innerText
		);
		return !projectNames.includes(projectName);
	}, projectName);
	await expect(page.getByRole('cell', { name: projectName })).toHaveCount(0);
}
