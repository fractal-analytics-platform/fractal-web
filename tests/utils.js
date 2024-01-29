import * as crypto from 'crypto';

export function generateUUID() {
	return crypto.randomBytes(16).toString('hex');
}

/**
 * Wait until spinner disappear
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
