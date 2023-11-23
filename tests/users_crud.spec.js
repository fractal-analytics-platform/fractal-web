import { expect, test } from './base_test.js';

test('Create, update and delete a user', async ({ page }) => {
	await test.step('Open the admin area', async () => {
		await page.goto('/');
		await page.getByRole('link', { name: 'Administration' }).click();
		await page.waitForURL('/admin');
	});

	await test.step('Open the manage users page', async () => {
		await page.getByRole('link', { name: 'Manage users' }).click();
		await page.waitForURL('/admin/users');
	});

	await test.step('Open the user registration page', async () => {
		await page.getByRole('link', { name: 'Register new user' }).click();
		await page.waitForURL('/admin/users/register');
	});

	const randomUserName = Math.random().toString(36).substring(7);

	await test.step('Test required fields validation errors', async () => {
		await page.getByRole('button', { name: 'Save' }).click();
		expect(await page.getByText('Field is required').count()).toEqual(2);

		await page.locator('#email').fill(randomUserName + '@example.com');
		await page.locator('#username').fill(randomUserName);
	});

	await test.step('Test password confirm validation errors', async () => {
		await page.locator('#password').fill('test');
		await page.getByRole('button', { name: 'Save' }).click();
		expect(await page.getByText("Passwords don't match").count()).toEqual(1);
	});

	/**@type {string|null}  */
	let userId = null;

	await test.step('Create user', async () => {
		await page.locator('#confirmPassword').fill('test');
		await page.locator('#slurmUser').fill(randomUserName + '_slurm');
		await page.locator('#cacheDir').fill('/tmp/test');

		await page.getByRole('button', { name: 'Save' }).click();
		await page.waitForURL('/admin/users');

		await expect(page.getByRole('cell', { name: randomUserName })).toHaveCount(3);

		const userRow = await getUserRow(page, randomUserName);
		userId = (await userRow[0].innerText()).trim();
		expect(await userRow[1].innerText()).toEqual(randomUserName + '@example.com');
		expect(await userRow[2].innerText()).toEqual(randomUserName);
		verifyChecked(userRow, 3, true);
		verifyChecked(userRow, 4, false);
		verifyChecked(userRow, 5, false);
		expect(await userRow[6].innerText()).toEqual(randomUserName + '_slurm');
	});

	expect(userId).not.toBeNull();

	await test.step('Display the user info page', async () => {
		await page.getByRole('row').last().getByRole('link', { name: 'Info' }).click();
		await page.waitForURL(`/admin/users/${userId}`);

		const cells = await page.locator('table td').all();
		expect(await cells[0].innerText()).toEqual(userId);
		expect(await cells[1].innerText()).toEqual(randomUserName + '@example.com');
		expect(await cells[2].innerText()).toEqual(randomUserName);
		verifyChecked(cells, 3, true);
		verifyChecked(cells, 4, false);
		verifyChecked(cells, 5, false);
		expect(await cells[6].innerText()).toEqual(randomUserName + '_slurm');
		expect(await cells[7].innerText()).toEqual('/tmp/test');
	});

	// Go back to previous page
	await page.getByRole('link', { name: 'Manage users' }).click();
	await page.waitForURL('/admin/users');

	await test.step('Open edit user page', async () => {
		await page.getByRole('row').last().getByRole('link', { name: 'Edit' }).click();
		await page.waitForURL(`/admin/users/${userId}/edit`);
	});

	await test.step('Test cache dir validation error', async () => {
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
	});

	await test.step('Rename username and set verified checkbox', async () => {
		await page.locator('#cacheDir').fill('/tmp/test');
		await page.locator('#username').fill(randomUserName + '-renamed');
		await page.locator('#slurmUser').fill(randomUserName + '_slurm-renamed');
		await page.locator('#verified').check();
		await page.getByRole('button', { name: 'Save' }).click();

		await page.waitForURL('/admin/users');

		const userRow = await getUserRow(page, randomUserName + '-renamed');
		expect(await userRow[1].innerText()).toEqual(randomUserName + '@example.com');
		expect(await userRow[2].innerText()).toEqual(randomUserName + '-renamed');
		verifyChecked(userRow, 3, true);
		verifyChecked(userRow, 4, false);
		verifyChecked(userRow, 5, true);
		expect(await userRow[6].innerText()).toEqual(randomUserName + '_slurm-renamed');
	});

	await test.step('Grant superuser privilege', async () => {
		await page.getByRole('row').last().getByRole('link', { name: 'Edit' }).click();
		await page.waitForURL(`/admin/users/${userId}/edit`);
		await page.locator('#superuser').check();
		await page.getByRole('button', { name: 'Save' }).click();

		const modalTitle = page.locator('.modal.show .modal-title');
		await modalTitle.waitFor();
		await expect(modalTitle).toHaveText('Confirm action');
		await expect(page.locator('.modal.show .modal-body')).toContainText(
			'Do you really want to grant superuser privilege to this user?'
		);
		await page.locator('.modal.show').getByRole('button', { name: 'Confirm' }).click();
		await page.waitForURL('/admin/users');
		await page.reload();

		const userRow = await getUserRow(page, randomUserName + '-renamed');
		verifyChecked(userRow, 3, true);
		verifyChecked(userRow, 4, true);
		verifyChecked(userRow, 5, true);
	});

	await test.step('Revoke superuser privilege', async () => {
		await page.getByRole('row').last().getByRole('link', { name: 'Edit' }).click();
		await page.waitForURL(`/admin/users/${userId}/edit`);
		await page.locator('#superuser').uncheck();
		await page.getByRole('button', { name: 'Save' }).click();

		const modalTitle = page.locator('.modal.show .modal-title');
		await modalTitle.waitFor();
		await expect(modalTitle).toHaveText('Confirm action');
		await expect(page.locator('.modal.show .modal-body')).toContainText(
			'Do you really want to revoke superuser privilege to this user?'
		);
		await page.locator('.modal.show').getByRole('button', { name: 'Confirm' }).click();
		await page.waitForURL('/admin/users');
		await page.reload();

		const userRow = await getUserRow(page, randomUserName + '-renamed');
		verifyChecked(userRow, 3, true);
		verifyChecked(userRow, 4, false);
		verifyChecked(userRow, 5, true);
	});
});

/**
 * @param {import('@playwright/test').Page} page
 * @param {string} username
 * @returns {Promise<import('@playwright/test').Locator[]>}
 */
async function getUserRow(page, username) {
	const rows = await page.locator('tbody tr').all();
	let result = null;
	for (const row of rows) {
		const cells = await row.locator('td').all();
		if (username === (await cells[2].innerText())) {
			result = cells;
			break;
		}
	}
	expect(result).not.toBeNull();
	return /**@type {import('@playwright/test').Locator[]} */ (result);
}

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
