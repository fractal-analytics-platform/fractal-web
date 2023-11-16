import { expect, test } from './base_test.js';

test('Create, update and delete a user', async ({ page }) => {
	await page.goto('/');
	await page.getByRole('link', { name: 'Administration' }).click();
	await page.waitForURL('/admin');

	// ---- LIST users ----

	await page.getByRole('link', { name: 'Manage users' }).click();
	await page.waitForURL('/admin/users');

	// Verify that it should not be possible to delete the current admin user
	await expect(page.getByRole('row').first().getByRole('button', { name: 'Delete' })).toHaveCount(
		0
	);

	// ---- CREATE user ----

	await page.getByRole('link', { name: 'Register new user' }).click();
	await page.waitForURL('/admin/users/register');

	const randomUserName = Math.random().toString(36).substring(7);

	// Test required fields validation errors
	await page.getByRole('button', { name: 'Save' }).click();
	expect(await page.getByText('Field is required').count()).toEqual(2);

	await page.locator('#email').fill(randomUserName + '@example.com');
	await page.locator('#username').fill(randomUserName);

	// Test password confirm validation errors
	await page.locator('#password').fill('test');
	await page.getByRole('button', { name: 'Save' }).click();
	expect(await page.getByText("Passwords don't match").count()).toEqual(1);

	await page.locator('#confirmPassword').fill('test');
	await page.locator('#slurmUser').fill(randomUserName + '_slurm');
	await page.locator('#cacheDir').fill('/tmp/test');

	await page.getByRole('button', { name: 'Save' }).click();
	await page.waitForURL('/admin/users');

	await expect(page.getByRole('cell', { name: randomUserName })).toHaveCount(3);

	let lastRow = await page.getByRole('row').last().getByRole('cell').all();
	const userId = (await lastRow[0].innerText()).trim();
	expect(await lastRow[1].innerText()).toEqual(randomUserName + '@example.com');
	expect(await lastRow[2].innerText()).toEqual(randomUserName);
	verifyChecked(lastRow, 3, true);
	verifyChecked(lastRow, 4, false);
	verifyChecked(lastRow, 5, false);
	expect(await lastRow[6].innerText()).toEqual(randomUserName + '_slurm');

	// ---- EDIT user ----

	await page.getByRole('row').last().getByRole('link', { name: 'Edit' }).click();
	await page.waitForURL(`/admin/users/${userId}`);

	// Test cache dir validation error
	await page.locator('#cacheDir').fill('foo');
	await page.getByRole('button', { name: 'Save' }).click();
	await page.waitForFunction(() => {
		const invalidFeeback = document.querySelector('#cacheDir + .invalid-feedback');
		if (invalidFeeback instanceof HTMLElement) {
			return invalidFeeback.innerText.includes(
				"String attribute 'cache_dir' must be an absolute path (given 'foo')"
			);
		}
		return false;
	});

	await page.locator('#cacheDir').fill('/tmp/test');
	await page.locator('#username').fill(randomUserName + '-renamed');
	await page.locator('#slurmUser').fill(randomUserName + '_slurm-renamed');
	await page.locator('#superuser').check();
	await page.locator('#verified').check();
	await page.getByRole('button', { name: 'Save' }).click();

	await page.waitForURL('/admin/users');

	lastRow = await page.getByRole('row').last().getByRole('cell').all();
	expect(await lastRow[1].innerText()).toEqual(randomUserName + '@example.com');
	expect(await lastRow[2].innerText()).toEqual(randomUserName + '-renamed');
	verifyChecked(lastRow, 3, true);
	verifyChecked(lastRow, 4, true);
	verifyChecked(lastRow, 5, true);
	expect(await lastRow[6].innerText()).toEqual(randomUserName + '_slurm-renamed');

	// ---- DELETE user ----

	await page.getByRole('row').last().getByRole('button', { name: 'Delete' }).click();

	const modalTitle = page.locator('.modal.show .modal-title');
	await modalTitle.waitFor();
	await expect(modalTitle).toHaveText('Confirm action');
	await expect(page.locator('.modal.show .modal-body')).toContainText(
		'Delete user ' + randomUserName + '@example.com'
	);

	// Confirm the deletion of the user
	await page.getByRole('button', { name: 'Confirm' }).click();

	await page.waitForFunction((username) => {
		const usernames = [...document.querySelectorAll('table td:nth-child(2)')].map(
			(c) => /** @type {HTMLElement} */ (c).innerText
		);
		return !usernames.includes(username);
	}, randomUserName);
	await expect(page.getByRole('cell', { name: randomUserName })).toHaveCount(0);
});

/**
 * @param {import('@playwright/test').Locator[]} row
 * @param {number} index
 * @param {boolean} checked
 */
async function verifyChecked(row, index, checked) {
	expect(await row[index].locator('span').getAttribute('aria-checked')).toEqual(checked.toString());
}
