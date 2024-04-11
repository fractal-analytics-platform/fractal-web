import * as crypto from 'crypto';
import path from 'path';
import fs from 'fs';
import os from 'os';

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
