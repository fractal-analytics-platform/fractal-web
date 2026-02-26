import { expect } from '@playwright/test';
import { selectSlimSelect, waitModalClosed, waitPageLoading } from '../utils';

/**
 * @param {import('@playwright/test').Page} page
 * @param {string} projectDir
 * @returns {Promise<string>}
 */
export async function createTestUser(page, projectDir = '/tmp') {
	const randomEmail = Math.random().toString(36).substring(7) + '@example.com';
	await page.goto('/v2/admin/users/register');
	await waitPageLoading(page);
	await page.getByRole('textbox', { name: 'E-mail' }).fill(randomEmail);
	await page.getByLabel('Password', { exact: true }).fill('test');
	await page.getByLabel('Confirm password').fill('test');
	await page.getByRole('textbox', { name: 'Project dir' }).fill(projectDir);
	await page.getByRole('button', { name: 'Save' }).click();
	await page.waitForURL(/\/v2\/admin\/users\/\d+\/edit/);
	await waitPageLoading(page);
	return randomEmail;
}

/**
 * @param {import('@playwright/test').Page} page
 * @param {string} projectDir
 * @returns {Promise<string>}
 */
export async function createGuestUser(page, projectDir = '/tmp') {
	const randomEmail = await createTestUser(page, projectDir);
	await page.getByRole('checkbox', { name: 'Guest' }).check();
	await page.getByRole('button', { name: 'Save' }).click();
	await waitPageLoading(page);
	await expect(page.getByText('User successfully updated')).toBeVisible();
	return randomEmail;
}

/**
 * @param {import('@playwright/test').Page} page
 * @param {string} groupName
 * @returns {Promise<number>} the number of selectable groups
 */
export async function addGroupToUser(page, groupName) {
	await page.getByRole('button', { name: 'Add group' }).click();
	const modal = page.locator('.modal.show');
	await modal.waitFor();
	const selectableGroups = await page.getByRole('option').count();
	await selectSlimSelect(page, page.getByRole('combobox', { name: 'Select groups' }), groupName, true);
	await modal.getByRole('button', { name: 'Add' }).click();
	if (await modal.getByText('Group is required').isVisible()) {
		// Sometimes playwright clicks the "Add" button before the slim-select change event
		// is propagated; in that case no group is selected and the error appears.
		console.warn('"Group is required" message was displayed. Retrying to add group.');
		await modal.getByRole('button', { name: 'Add' }).click();
	}
	await waitModalClosed(page);
	await expect(page.getByRole('button', { name: `Remove group ${groupName}` })).toBeVisible();
	return selectableGroups;
}


/**
 * @param {import('@playwright/test').Locator[]} row
 * @param {number} index
 * @param {boolean} checked
 */
export async function verifyChecked(row, index, checked) {
	expect(await row[index].locator('.boolean-icon').getAttribute('aria-checked')).toEqual(
		checked.toString()
	);
}