import { expect, test } from '@playwright/test';
import { waitModalClosed, waitPageLoading } from '../utils.js';

test('Create and update a user', async ({ page }) => {
	await test.step('Open the admin area', async () => {
		await page.goto('/v2/admin');
		await waitPageLoading(page);
	});

	await test.step('Open the manage users page', async () => {
		await page.getByRole('link', { name: 'Manage users' }).click();
		await waitPageLoading(page);
		await page.getByText('Users list').waitFor();
	});

	await test.step('Open the user registration page', async () => {
		await page.getByRole('link', { name: 'Register new user' }).click();
		await waitPageLoading(page);
		await page.getByText('Registering new user').waitFor();
	});

	const randomUserName = Math.random().toString(36).substring(7);

	await test.step('Test required fields validation errors', async () => {
		await page.getByLabel('Username').fill(randomUserName);
		await page.getByRole('button', { name: 'Save' }).click();
		expect(await page.getByText('Field is required').count()).toEqual(2);
		await page.getByLabel('E-mail').fill(randomUserName + '@example.com');
	});

	await test.step('Test password confirm validation errors', async () => {
		await page.getByLabel('Password', { exact: true }).fill('test');
		await page.getByRole('button', { name: 'Save' }).click();
		expect(await page.getByText("Passwords don't match").count()).toEqual(1);
	});

	/**@type {string|null}  */
	let userId = null;

	await test.step('Create user', async () => {
		await page.getByLabel('Confirm password').fill('test');
		await page.getByRole('button', { name: 'Save' }).click();
		await waitPageLoading(page);
		await page.getByText('Editing user').waitFor();
	});

	await test.step('Check user in users list', async () => {
		await page.goto('/v2/admin/users');
		await waitPageLoading(page);
		await expect(page.getByRole('cell', { name: randomUserName })).toHaveCount(2);
		const userRowCells = await getUserRowCells(page, randomUserName);
		userId = (await userRowCells[0].innerText()).trim();
		expect(await userRowCells[1].innerText()).toEqual(randomUserName + '@example.com');
		expect(await userRowCells[2].innerText()).toEqual(randomUserName);
		verifyChecked(userRowCells, 3, true);
		verifyChecked(userRowCells, 4, false);
		verifyChecked(userRowCells, 5, true);
	});

	expect(userId).not.toBeNull();

	await test.step('Display the user info page', async () => {
		const userRow = await getUserRow(page, randomUserName);
		await userRow.getByRole('link', { name: 'Info' }).click();
		await page.waitForURL(/\/v2\/admin\/users\/\d+/);
		await waitPageLoading(page);
		const cells = await page.locator('table td').all();
		expect(await cells[0].innerText()).toEqual(userId);
		expect(await cells[1].innerText()).toEqual(randomUserName + '@example.com');
		expect(await cells[2].innerText()).toEqual(randomUserName);
		verifyChecked(cells, 3, true);
		verifyChecked(cells, 4, false);
		verifyChecked(cells, 5, true);
		expect(await cells[6].innerText()).toEqual('All');
		expect(await cells[7].innerText()).toEqual('-');
		expect(await cells[8].innerText()).toEqual('-');
		expect(await cells[9].innerText()).toEqual('-');
	});

	await test.step('Go back to previous page', async () => {
		await page.getByRole('link', { name: 'Manage users' }).click();
		await waitPageLoading(page);
		await expect(page.getByText('Users list')).toBeVisible();
	});

	await test.step('Open edit user page', async () => {
		const userRow = await getUserRow(page, randomUserName);
		await userRow.getByRole('link', { name: 'Edit' }).click();
		await waitPageLoading(page);
		await page.waitForURL(/\/v2\/admin\/users\/\d+/);
	});

	await test.step('Test project dir validation error', async () => {
		await page.getByLabel('Project dir').fill('foo');
		await page.getByRole('button', { name: 'Save' }).click();
		await page.waitForFunction(() => {
			const invalidFeeback = document
				.querySelector('#projectDir')
				?.closest('div')
				?.querySelector('.invalid-feedback');
			if (invalidFeeback instanceof HTMLElement) {
				return invalidFeeback.innerText.includes(
					"String attribute 'project_dir' must be an absolute path (given 'foo')"
				);
			}
			return false;
		});
		await page.getByLabel('Project dir').fill('/tmp/test/project-dir');
	});

	await test.step('SLURM account validation error', async () => {
		await page.getByRole('button', { name: 'Add SLURM account' }).click();
		await page.getByRole('button', { name: 'Add SLURM account' }).click();
		await page
			.getByRole('textbox', { name: /^SLURM account #1/ })
			.fill(randomUserName + '-slurm-account');
		await page
			.getByRole('textbox', { name: /^SLURM account #2/ })
			.fill(randomUserName + '-slurm-account');
		await page.getByRole('button', { name: 'Save' }).click();
		await page.getByText('`slurm_accounts` list has repetitions').waitFor();
		await page.getByLabel('Remove SLURM account').first().click();
	});

	await test.step('Rename username and unset verified checkbox', async () => {
		await page.getByLabel('Username').fill(randomUserName + '-renamed');
		const verifiedCheckbox = page.getByLabel('Verified');
		await verifiedCheckbox.waitFor();
		expect(await verifiedCheckbox.isChecked()).toEqual(true);
		await verifiedCheckbox.uncheck();
		await page.getByRole('button', { name: 'Save' }).click();
		await expect(page.getByText('User successfully updated')).toBeVisible();
	});

	await test.step('Update settings', async () => {
		await page.getByLabel('Project dir').fill('/tmp/test/project-dir');
		await page.getByLabel('SLURM user').fill(randomUserName + '_slurm-renamed');
		await page.getByRole('button', { name: 'Save' }).click();
		await expect(page.getByText('User successfully updated')).toBeVisible();
	});

	await test.step('Check user in users list', async () => {
		await page.goto('/v2/admin/users');
		await waitPageLoading(page);
		const userRowCells = await getUserRowCells(page, randomUserName + '-renamed');
		expect(await userRowCells[1].innerText()).toEqual(randomUserName + '@example.com');
		expect(await userRowCells[2].innerText()).toEqual(randomUserName + '-renamed');
		verifyChecked(userRowCells, 3, true);
		verifyChecked(userRowCells, 4, false);
		verifyChecked(userRowCells, 5, false);
	});

	await test.step('Display the user info page', async () => {
		const userRow = await getUserRow(page, randomUserName + '-renamed');
		await userRow.getByRole('link', { name: 'Info' }).click();
		await page.waitForURL(/\/v2\/admin\/users\/\d+/);
		await waitPageLoading(page);
		const cells = await page.locator('table td').all();
		expect(await cells[0].innerText()).toEqual(userId);
		expect(await cells[1].innerText()).toEqual(randomUserName + '@example.com');
		expect(await cells[2].innerText()).toEqual(randomUserName + '-renamed');
		verifyChecked(cells, 3, true);
		verifyChecked(cells, 4, false);
		verifyChecked(cells, 5, false);
		expect(await cells[6].innerText()).toEqual('All');
		expect(await cells[7].innerText()).toEqual('/tmp/test/project-dir');
		expect(await cells[8].innerText()).toEqual(randomUserName + '_slurm-renamed');
		expect(await cells[9].innerText()).toContain(randomUserName + '-slurm-account');
	});

	await test.step('Go back clicking on breadcrumb', async () => {
		await page.getByText('Manage users').click();
		await waitPageLoading(page);
		await expect(page.getByText('Users list')).toBeVisible();
	});

	await test.step('Grant superuser privilege', async () => {
		const userRow = await getUserRow(page, randomUserName + '-renamed');
		await userRow.getByRole('link', { name: 'Edit' }).click();
		await page.locator('#superuser').check();
		await page.getByRole('button', { name: 'Save' }).click();

		const modalTitle = page.locator('.modal.show .modal-title');
		await modalTitle.waitFor();
		await expect(modalTitle).toHaveText('Confirm action');
		await expect(page.locator('.modal.show .modal-body')).toContainText(
			'Do you really want to grant superuser privilege to this user?'
		);
		await page.locator('.modal.show').getByRole('button', { name: 'Confirm' }).click();
		await expect(page.getByText('User successfully updated')).toBeVisible();
	});

	await test.step('Edit user after having granted superuser privilege', async () => {
		await page.getByRole('button', { name: 'Close' }).click();
		await expect(page.getByText('User successfully updated')).not.toBeVisible();
		await page.getByRole('textbox', { name: 'Username' }).fill(`${randomUserName}-renamed-2`);
		await page.getByRole('button', { name: 'Save' }).click();
		await expect(page.getByText('User successfully updated')).toBeVisible();
	});

	await test.step('Check user in users list', async () => {
		await page.goto('/v2/admin/users');
		await waitPageLoading(page);
		await expect(page.getByText('Users list')).toBeVisible();
		const userRowCells = await getUserRowCells(page, randomUserName + '-renamed-2');
		verifyChecked(userRowCells, 3, true);
		verifyChecked(userRowCells, 4, true);
		verifyChecked(userRowCells, 5, false);
	});

	await test.step('Revoke superuser privilege', async () => {
		const userRow = await getUserRow(page, randomUserName + '-renamed-2');
		await userRow.getByRole('link', { name: 'Edit' }).click();
		await waitPageLoading(page);
		await page.waitForURL(/\/v2\/admin\/users\/\d+/);
		await page.locator('#superuser').uncheck();
		await page.getByRole('button', { name: 'Save' }).click();

		const modalTitle = page.locator('.modal.show .modal-title');
		await modalTitle.waitFor();
		await expect(modalTitle).toHaveText('Confirm action');
		await expect(page.locator('.modal.show .modal-body')).toContainText(
			'Do you really want to revoke superuser privilege to this user?'
		);
		await page.locator('.modal.show').getByRole('button', { name: 'Confirm' }).click();
		await waitModalClosed(page);
		await expect(page.getByText('User successfully updated')).toBeVisible();
	});

	await test.step('Check user in users list', async () => {
		await page.goto('/v2/admin/users');
		await waitPageLoading(page);
		await expect(page.getByText('Users list')).toBeVisible();
		const userRowCells = await getUserRowCells(page, randomUserName + '-renamed-2');
		verifyChecked(userRowCells, 3, true);
		verifyChecked(userRowCells, 4, false);
		verifyChecked(userRowCells, 5, false);
	});

	await test.step("Verify that the admin can't edit his/her superuser status", async () => {
		await page.goto(`/v2/admin/users/1/edit`);
		await waitPageLoading(page);
		expect(await page.locator('input[type="checkbox"]').count()).toEqual(0);
	});
});

/**
 * @param {import('@playwright/test').Page} page
 * @param {string} username
 * @returns {Promise<import('@playwright/test').Locator[]>}
 */
async function getUserRowCells(page, username) {
	const row = await getUserRow(page, username);
	return await row.locator('td').all();
}

/**
 * @param {import('@playwright/test').Page} page
 * @param {string} username
 * @returns {Promise<import('@playwright/test').Locator>}
 */
async function getUserRow(page, username) {
	await page.getByRole('row').getByText(username, { exact: true }).waitFor();
	const rows = await page.locator('tbody tr').all();
	for (const row of rows) {
		const cells = await row.locator('td').all();
		if (username === (await cells[2].innerText())) {
			return row;
		}
	}
	throw new Error(`Row not found for user ${username}`);
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
