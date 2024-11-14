import { expect } from '@playwright/test';
import { waitModalClosed, waitPageLoading } from '../utils';

/**
 * @param {import('@playwright/test').Page} page
 * @returns {Promise<string>}
 */
export async function createTestGroup(page) {
	const randomGroupName = Math.random().toString(36).substring(7);
	await page.goto('/v2/admin/groups');
	await waitPageLoading(page);
	await page.getByRole('button', { name: 'Create new group' }).click();
	const modal = page.locator('.modal.show');
	await modal.waitFor();
	await modal.getByRole('textbox', { name: 'Group name' }).fill(randomGroupName);
	await modal.getByRole('button', { name: 'Create' }).click();
	await page.getByText('Members of the group').waitFor();
	return randomGroupName;
}

/**
 * @param {import('@playwright/test').Page} page
 * @param {string} userEmail
 */
export async function addUserToGroup(page, userEmail) {
	const dragArea = page.getByText('drag the users here');
	const availableUsers = await page.locator('[draggable="true"]').allInnerTexts();
	expect(availableUsers.length).toBeGreaterThan(1);
	await page.getByPlaceholder('Filter users').fill(userEmail);
	await expect(page.locator('[draggable="true"]')).toHaveCount(1);
	const userBadge = page.getByRole('button', { name: userEmail, exact: true });
	await userBadge.dragTo(dragArea);
	await expect(page.locator('.spinner-border-sm')).not.toBeVisible();
	await expect(page.getByRole('region')).toContainText(userEmail);
}

/**
 * @param {import('@playwright/test').Page} page
 * @param {string} groupName
 */
export async function deleteGroup(page, groupName) {
	if (!page.url().endsWith('/v2/admin/groups')) {
		await page.goto('/v2/admin/groups');
		await waitPageLoading(page);
	}
	await page.getByRole('row', { name: groupName }).getByRole('button', { name: 'Delete' }).click();
	const modal = page.locator('.modal.show');
	await modal.waitFor();
	await modal.getByRole('button', { name: 'Confirm' }).click();
	await waitModalClosed(page);
	await expect(page.getByRole('row', { name: groupName })).not.toBeVisible();
}
