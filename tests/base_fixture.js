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
		await use(page);
		const url = page.url();
		if (url !== 'about:blank' && !url.includes('/_app')) {
			await checkAccessibility(page);
		}
	}
});

/**
 * @param {import('@playwright/test').Page} page
 * @param {string|undefined=} element
 */
export async function checkAccessibility(page, element = undefined) {
	const axeBuilder = new AxeBuilder({ page })
		.withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
		// excluding slim-select due to aria-activedescendant issue
		.exclude('.ss-main');
	if (element) {
		axeBuilder.include(element);
	}
	const accessibilityScanResults = await axeBuilder.analyze();
	expect(accessibilityScanResults.violations).toEqual([]);
}
