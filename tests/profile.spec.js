import { expect, test } from './base_test.js';

test('User profile', async ({ page }) => {
	await test.step('Open user profile page', async () => {
		await page.goto('/');
		await page.getByRole('button', { name: 'admin@fractal.xy' }).click();
		await page.getByRole('link', { name: 'My profile' }).click();
		await page.waitForURL('/profile');

		const cells = await page.locator('table td').all();
		expect(await cells[0].innerText()).toEqual('1');
		expect(await cells[2].innerText()).toEqual('admin@fractal.xy');
		expect(await cells[4].innerText()).toEqual('admin');
		verifyChecked(cells, 6, true);
		verifyChecked(cells, 8, true);
		expect(await cells[12].innerText()).toEqual('-');
	});

	await test.step('Save cache dir using button', async () => {
		await page.getByRole('button', { name: 'Edit' }).click();
		await page.getByRole('textbox').waitFor();
		await page.getByRole('textbox').fill('');
		await page.getByRole('button', { name: 'Save' }).click();
		await page.getByText("String attribute 'cache_dir' cannot be empty").waitFor();
		await page.getByRole('textbox').fill('/tmp/foo1');
		await page.getByRole('button', { name: 'Save' }).click();
		await page.getByRole('button', { name: 'Edit' }).waitFor();
	});

	await test.step('Save cache dir using enter', async () => {
		await page.getByRole('button', { name: 'Edit' }).click();
		await page.getByRole('textbox').waitFor();
		await page.getByRole('textbox').fill('/tmp/foo2');
		await page.keyboard.down('Enter');
		await page.getByRole('button', { name: 'Edit' }).waitFor();
	});

	await test.step('Verify cache dir updated', async () => {
		await page.reload();
		const cells = await page.locator('table td').all();
		expect(await cells[14].innerText()).toEqual('/tmp/foo2');
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
