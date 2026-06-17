import { test as base, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/**
 * @typedef {Object} AxeFixture
 * @property {(params: { page: any }, use: any) => Promise<void>} makeAxeBuilder
 */

/**
 * @type {import('@playwright/test').TestType<
 *   import('@playwright/test').PlaywrightTestArgs & import('@playwright/test').PlaywrightTestOptions &
 *     { makeAxeBuilder: () => {analyze: () => Promise<import('axe-core').AxeResults>} },
 *   import('@playwright/test').PlaywrightWorkerArgs & import('@playwright/test').PlaywrightWorkerOptions
 * >}
 */
export const test = base.extend(
	/** @type {AxeFixture} */ ({
		makeAxeBuilder: async ({ page }, use) => {
			const makeAxeBuilder = () =>
				new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']);

			await use(makeAxeBuilder);
			await checkAccessibility(makeAxeBuilder);
		}
	})
);

/**
 * @param {() => {analyze: () => Promise<import('axe-core').AxeResults>}} makeAxeBuilder
 */
export const checkAccessibility = async function (makeAxeBuilder) {
	const accessibilityScanResults = await makeAxeBuilder().analyze();
	expect(accessibilityScanResults.violations).toEqual([]);
};
