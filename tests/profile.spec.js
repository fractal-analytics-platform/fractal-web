import { expect, test } from '@playwright/test';
import { waitPageLoading } from './utils.js';

test('User profile', async ({ page }) => {
	await test.step('Open user profile page', async () => {
		await page.goto('/');
		await waitPageLoading(page);
		await page.getByRole('button', { name: 'admin@fractal.xy' }).click();
		await page.getByRole('link', { name: 'My profile' }).click();
		await waitPageLoading(page);
		await page.getByText('User ID').waitFor();

		const cells = await page.locator('table td').all();
		await expect(cells[0]).toHaveText('1');
		await expect(cells[1]).toHaveText('admin@fractal.xy');
		await expect(cells[2]).toHaveText('admin');
		await verifyChecked(cells, 3, true);
		await verifyChecked(cells, 4, true);
		await expect(cells[6]).toContainText('All');
		await expect(cells[7]).toHaveText('-');
	});
});

/**
 * @param {import('@playwright/test').Locator[]} row
 * @param {number} index
 * @param {boolean} checked
 */
async function verifyChecked(row, index, checked) {
	expect(await row[index].locator('.boolean-icon').getAttribute('aria-checked')).toEqual(
		checked.toString()
	);
}
