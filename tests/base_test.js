import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { test as baseTest } from '@playwright/test';

const istanbulCLIOutput = path.join(process.cwd(), 'coverage-playwright');

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
 * Base test adding coverage logic using istanbul.
 */
export const test = baseTest.extend({
	context: async ({ context }, use) => {
		await context.addInitScript(() => {
			const instanbulWindow = /** @type {any} */ (window);
			window.addEventListener('beforeunload', () =>
				instanbulWindow.collectIstanbulCoverage(JSON.stringify(instanbulWindow.__coverage__))
			);
		});
		await fs.promises.mkdir(istanbulCLIOutput, { recursive: true });
		await context.exposeFunction(
			'collectIstanbulCoverage',
			(/** @type {string} */ coverageJSON) => {
				if (coverageJSON)
					fs.writeFileSync(
						path.join(istanbulCLIOutput, `playwright_coverage_${generateUUID()}.json`),
						coverageJSON
					);
			}
		);
		await use(context);
		for (const page of context.pages()) {
			await page.evaluate(() => {
				const instanbulWindow = /** @type {any} */ (window);
				instanbulWindow.collectIstanbulCoverage(JSON.stringify(instanbulWindow.__coverage__));
			});
		}
	}
});

export const expect = test.expect;
