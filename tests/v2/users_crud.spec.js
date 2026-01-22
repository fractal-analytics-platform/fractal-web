import { expect, test } from '@playwright/test';
import { waitModal, waitModalClosed, waitPageLoading } from '../utils.js';
import { addGroupToUser, verifyChecked } from './user_utils.js';

test('Create and update a user', async ({ page }) => {
	const randomGroupName = Math.random().toString(36).substring(7);

	await test.step('Add test group', async () => {
		await page.goto('/v2/admin/groups');
		await waitPageLoading(page);
		await page.getByRole('button', { name: 'Create new group' }).click();
		const modal = await waitModal(page);
		await modal.getByRole('textbox', { name: 'Group name' }).fill(randomGroupName);
		await modal.getByRole('button', { name: 'Create' }).click();
		await waitModalClosed(page);
	});

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
		await page.getByLabel('E-mail').fill(randomUserName + '@example.com');
		await page.getByRole('button', { name: 'Save' }).click();
		expect(await page.getByText('Field is required').count()).toEqual(1);
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
		await page.getByRole('textbox', { name: 'Project dir' }).fill('/tmp');
		await addGroupToUser(page, randomGroupName);
		await page.getByRole('button', { name: 'Save' }).click();
		await waitPageLoading(page);
		await page.getByText('Editing user').waitFor();
	});

	await test.step('Check user in users list', async () => {
		await page.goto('/v2/admin/users');
		await waitPageLoading(page);
		await expect(page.getByRole('cell', { name: randomUserName })).toHaveCount(1);
		const userRowCells = await getUserRowCells(page, randomUserName);
		userId = (await userRowCells[0].innerText()).trim();
		await expect(userRowCells[1]).toContainText(randomUserName + '@example.com');
		await verifyChecked(userRowCells, 2, true);
		await verifyChecked(userRowCells, 3, false);
		await verifyChecked(userRowCells, 4, true);
	});

	expect(userId).not.toBeNull();

	await test.step('Display the user info page', async () => {
		const userRow = getUserRow(page, randomUserName);
		await userRow.getByRole('link', { name: 'Info' }).click();
		await page.waitForURL(/\/v2\/admin\/users\/\d+/);
		await waitPageLoading(page);
		const cells = await page.locator('table td').all();
		await expect(cells[0]).toHaveText(/** @type {string} */(userId));
		await expect(cells[1]).toHaveText(randomUserName + '@example.com');
		await verifyChecked(cells, 2, true);
		await verifyChecked(cells, 3, false);
		await verifyChecked(cells, 4, true);
		await verifyChecked(cells, 5, false);
		await expect(cells[6]).toContainText('All');
		await expect(cells[6]).toContainText(randomGroupName);
		await expect(cells[7]).toHaveText('Local profile');
		await expect(cells[8]).toHaveText('/tmp');
	});

	await test.step('Go back to previous page', async () => {
		await page.getByRole('link', { name: 'Manage users' }).click();
		await waitPageLoading(page);
		await expect(page.getByText('Users list')).toBeVisible();
	});

	await test.step('Open edit user page', async () => {
		const userRow = getUserRow(page, randomUserName);
		await userRow.getByRole('link', { name: 'Edit' }).click();
		await waitPageLoading(page);
		await page.waitForURL(/\/v2\/admin\/users\/\d+/);
	});

	await test.step('Test project dir validation error', async () => {
		await page.getByLabel('Project dir').fill('foo');
		await page.getByRole('button', { name: 'Save' }).click();
		await expect(
			page.getByText("Value error, String must be an absolute path (given 'foo')")
		).toBeVisible();
		await page.getByLabel('Project dir').fill('/tmp/test/project-dir');
	});

	await test.step('Rename email and unset verified checkbox', async () => {
		await page.getByLabel('E-mail').fill(randomUserName + '-renamed@example.com');
		const verifiedCheckbox = page.getByLabel('Verified');
		await verifiedCheckbox.waitFor();
		expect(await verifiedCheckbox.isChecked()).toEqual(true);
		await verifiedCheckbox.uncheck();
		await page.getByRole('button', { name: 'Save' }).click();
		await expect(page.getByText('User successfully updated')).toBeVisible();
	});

	await test.step('Update settings', async () => {
		await page.getByLabel('Project dir').fill('/tmp/test/project-dir-renamed');
		await page.getByRole('button', { name: 'Save' }).click();
		await expect(page.getByText('User successfully updated')).toBeVisible();
	});

	await test.step('Check user in users list', async () => {
		await page.goto('/v2/admin/users');
		await waitPageLoading(page);
		const userRowCells = await getUserRowCells(page, randomUserName + '-renamed');
		await expect(userRowCells[1]).toContainText(randomUserName + '-renamed@example.com');
		await verifyChecked(userRowCells, 2, true);
		await verifyChecked(userRowCells, 3, false);
		await verifyChecked(userRowCells, 4, false);
		await verifyChecked(userRowCells, 5, false);
		await expect(userRowCells[6]).toContainText('Local profile');
	});

	await test.step('Display the user info page', async () => {
		const userRow = getUserRow(page, randomUserName + '-renamed');
		await userRow.getByRole('link', { name: 'Info' }).click();
		await page.waitForURL(/\/v2\/admin\/users\/\d+/);
		await waitPageLoading(page);
		const cells = await page.locator('table td').all();
		await expect(cells[0]).toContainText(/**@type {string} */(userId));
		await expect(cells[1]).toContainText(randomUserName + '-renamed@example.com');
		await verifyChecked(cells, 2, true);
		await verifyChecked(cells, 3, false);
		await verifyChecked(cells, 4, false);
		await verifyChecked(cells, 5, false);
		await expect(cells[6]).toContainText('All');
		await expect(cells[7]).toContainText('Local profile');
		expect(await cells[8].innerText()).toEqual('/tmp/test/project-dir-renamed');
	});

	await test.step('Go back clicking on breadcrumb', async () => {
		await page.getByText('Manage users').click();
		await waitPageLoading(page);
		await expect(page.getByText('Users list')).toBeVisible();
	});

	await test.step('Grant superuser privilege', async () => {
		const userRow = getUserRow(page, randomUserName + '-renamed');
		await userRow.getByRole('link', { name: 'Edit' }).click();
		await expect(page.getByRole('checkbox', { name: 'Guest' })).toBeEnabled();
		await page.getByRole('checkbox', { name: 'Superuser' }).check();
		await expect(page.getByRole('checkbox', { name: 'Guest' })).not.toBeEnabled();
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
		await page
			.getByRole('textbox', { name: 'E-mail' })
			.fill(`${randomUserName}-renamed-2@example.com`);
		await page.getByRole('button', { name: 'Save' }).click();
		await expect(page.getByText('User successfully updated')).toBeVisible();
	});

	await test.step('Check user in users list', async () => {
		await page.goto('/v2/admin/users');
		await waitPageLoading(page);
		await expect(page.getByText('Users list')).toBeVisible();
		const userRowCells = await getUserRowCells(page, randomUserName + '-renamed-2');
		await verifyChecked(userRowCells, 2, true);
		await verifyChecked(userRowCells, 3, true);
		await verifyChecked(userRowCells, 4, false);
	});

	await test.step('Revoke superuser privilege', async () => {
		const userRow = getUserRow(page, randomUserName + '-renamed-2');
		await userRow.getByRole('link', { name: 'Edit' }).click();
		await waitPageLoading(page);
		await page.waitForURL(/\/v2\/admin\/users\/\d+/);
		await page.getByRole('checkbox', { name: 'Superuser' }).uncheck();
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
		await verifyChecked(userRowCells, 2, true);
		await verifyChecked(userRowCells, 3, false);
		await verifyChecked(userRowCells, 4, false);
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
	const row = getUserRow(page, username);
	return await row.locator('td').all();
}

/**
 * @param {import('@playwright/test').Page} page
 * @param {string} username
 * @returns {import('@playwright/test').Locator}
 */
function getUserRow(page, username) {
	const email = `${username}@example.com`;
	return page.getByRole('row', { name: email });
}
