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
