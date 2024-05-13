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
	await page.waitForFunction(() => !document.querySelector('.loading')?.classList.contains('show'));
}

/**
 * Wait until modal is closed
 * @param {import('@playwright/test').Page} page
 */
export async function waitModalClosed(page) {
	await page.waitForFunction(() => document.querySelector('.modal.show') === null);
	await expect(page.locator('.modal.show')).toHaveCount(0);
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
 * @returns {Promise<string>} the path of the created file
 */
export async function uploadFile(page, selectorText, fileName, data) {
	const file = path.join(os.tmpdir(), fileName);
	fs.writeFileSync(file, JSON.stringify(data));

	const fileChooserPromise = page.waitForEvent('filechooser');
	await page.getByText(selectorText).click();
	const fileChooser = await fileChooserPromise;
	await fileChooser.setFiles(file);

	return file;
}

/**
 * @param {import('@playwright/test').Page} page
 * @param {import('@playwright/test').Locator} selector
 * @param {string} optionValue
 */
export async function selectSlimSelect(page, selector, optionValue) {
	await selector.click();
	const items = await page.getByRole('option').all();
	let selectedItem = null;
	for (const item of items) {
		const itemText = await item.innerText();
		if (itemText.includes(optionValue)) {
			selectedItem = item;
			break;
		}
	}
	expect(selectedItem).not.toBeNull();
	await /** @type {import('@playwright/test').Locator} */ (selectedItem).click();
	await expect(selector).toHaveText(optionValue);
}
