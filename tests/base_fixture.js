import { test as base, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/**
 * @type {import('@playwright/test').TestType<
 *   import('@playwright/test').PlaywrightTestArgs & import('@playwright/test').PlaywrightTestOptions,
 *   import('@playwright/test').PlaywrightWorkerArgs & import('@playwright/test').PlaywrightWorkerOptions
 * >}
 */
export const test = base.extend({
	page: async ({ page }, use) => {
		const makeAxeBuilder = getMakeAxeBuilder(page);
		await use(page);
		const url = page.url();
		if (url !== 'about:blank' && !url.includes('/_app')) {
			const accessibilityScanResults = await makeAxeBuilder().analyze();
			expect(accessibilityScanResults.violations).toEqual([]);
		}
	}
});

/**
 *
 * @param {import('@playwright/test').Page} page
 */
export async function checkAccessibility(page) {
	const makeAxeBuilder = getMakeAxeBuilder(page);
	const accessibilityScanResults = await makeAxeBuilder().analyze();
	expect(accessibilityScanResults.violations).toEqual([]);
}

/**
 * @param {import('@playwright/test').Page} page
 */
function getMakeAxeBuilder(page) {
	return () => new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']);
}
