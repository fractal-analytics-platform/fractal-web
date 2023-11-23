import { expect, test } from './base_test.js';

test('User profile', async ({ page }) => {
	await page.goto('/');
	await page.getByRole('link', { name: 'admin@fractal.xy' }).click();
	await page.waitForURL('/profile');

	const cells = await page.locator('table td').all();
	expect(await cells[0].innerText()).toEqual('1');
	expect(await cells[1].innerText()).toEqual('admin@fractal.xy');
	expect(await cells[2].innerText()).toEqual('admin');
	verifyChecked(cells, 3, true);
	verifyChecked(cells, 4, true);
	expect(await cells[6].innerText()).toEqual('-');
	expect(await cells[7].innerText()).toEqual('-');
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
