import { expect, test } from '@playwright/test';
import { getRandomName, waitPageLoading } from '../../../utils/utils.js';
import { addGroupToUser } from '../../../utils/v2/user.js';
import { createTestGroup, deleteGroup } from '../../../utils/group.js';

test('User creation edge case: user is created but groups call fail', async ({ page }) => {
	const group = await createTestGroup(page);

	const randomEmail = getRandomName() + '@example.com';

	await test.step('Open create user page and fill the values', async () => {
		await page.goto('/v2/admin/users/register');
		await waitPageLoading(page);
		await page.getByRole('textbox', { name: 'E-mail' }).fill(randomEmail);
		await page.getByLabel('Password', { exact: true }).fill('test');
		await page.getByLabel('Confirm password').fill('test');
		await page.getByRole('textbox', { name: 'Project dir' }).fill('/tmp');

		await addGroupToUser(page, group.name);
	});

	await test.step('Delete the test group in background', async () => {
		await deleteGroup(page, group.id);
	});

	await test.step('Save the user and verify group error', async () => {
		await page.getByRole('button', { name: 'Save' }).click();
		await page.waitForURL(/\/v2\/admin\/users\/\d+\/edit/);
		await waitPageLoading(page);
		await expect(page.getByText(/Some UserGroups in .* do not exist./)).toBeVisible();
	});
});
