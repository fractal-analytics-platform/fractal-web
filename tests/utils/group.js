import { expect } from '@playwright/test';
import { checkApiError, getFractalCookie, getRandomName } from './utils';

/**
 * @param {import('@playwright/test').Page} page
 * @returns {Promise<{id: number, name: string}>}
 */
export async function createTestGroup(page) {
	const name = getRandomName();
	const response = await page.request.post(`/api/auth/group`, {
		headers: { Cookie: await getFractalCookie(page) },
		data: { name }
	});

	await checkApiError(response, 'Unable to create group');
	return await response.json();
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
 * @param {number} groupId
 */
export async function deleteGroup(page, groupId) {
	const response = await page.request.delete(`/api/auth/group/${groupId}`, {
		headers: { Cookie: await getFractalCookie(page) }
	});
	await checkApiError(response, 'Unable to delete group');
}
