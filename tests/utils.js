import * as crypto from 'crypto';

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
