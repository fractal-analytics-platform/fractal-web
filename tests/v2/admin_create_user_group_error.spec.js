import { expect, test } from '@playwright/test';
import { waitModal, waitModalClosed, waitPageLoading } from '../utils.js';
import { createTestGroup } from './group_utils.js';
import { addGroupToUser } from './user_utils.js';

test('User creation edge case: user is created but groups call fail', async ({ page, context }) => {
	let group;
	await test.step('Create test group', async () => {
		group = await createTestGroup(page);
	});

	const randomEmail = Math.random().toString(36).substring(7) + '@example.com';

	await test.step('Open create user page and fill the values', async () => {
		await page.goto('/v2/admin/users/register');
		await waitPageLoading(page);
		await page.getByRole('textbox', { name: 'E-mail' }).fill(randomEmail);
		await page.getByLabel('Password', { exact: true }).fill('test');
		await page.getByLabel('Confirm password').fill('test');
		await page.getByRole('textbox', { name: 'Project dir' }).fill('/tmp');

		await addGroupToUser(page, group);
	});

	await test.step('Delete the test group in a new tab', async () => {
		const newPage = await context.newPage();
		await newPage.goto(`/v2/admin/groups`);
		await waitPageLoading(newPage);
		await newPage.getByRole('row', { name: group }).getByRole('button', { name: 'Delete' }).click();
		const modal = await waitModal(newPage);
		await modal.getByRole('button', { name: 'Confirm' }).click();
		await waitModalClosed(newPage);
		await newPage.close();
	});

	await test.step('Save the user and verify group error', async () => {
		await page.getByRole('button', { name: 'Save' }).click();
		await page.waitForURL(/\/v2\/admin\/users\/\d+\/edit/);
		await waitPageLoading(page);
		await expect(page.getByText(/Some UserGroups in .* do not exist./)).toBeVisible();
	});
});
