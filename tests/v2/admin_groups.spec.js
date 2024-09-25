import { expect, test } from '@playwright/test';
import { selectSlimSelect, waitModalClosed, waitPageLoading } from '../utils.js';

test('Admin groups management', async ({ page }) => {
	let user1;
	await test.step('Create test user', async () => {
		user1 = await createTestUser(page);
	});

	let group1;
	await test.step('Create test group1', async () => {
		group1 = await createTestGroup(page);
	});

	/** @type {string[]}  */
	let availableUsers;
	await test.step('Add all available users to the group', async () => {
		const dragArea = page.getByText('drag the users here');
		availableUsers = await page.locator('[draggable="true"]').allInnerTexts();
		expect(availableUsers.length).toBeGreaterThan(1);
		for (const user of availableUsers) {
			const userBadge = page.getByRole('button', { name: user, exact: true });
			await userBadge.dragTo(dragArea);
			await expect(page.locator('.spinner-border-sm')).not.toBeVisible();
		}
		await expect(page.getByText('No more users available')).toBeVisible();
	});

	await test.step('Check group info page', async () => {
		await page.goto('/v2/admin/groups');
		await waitPageLoading(page);
		await page.getByRole('row', { name: group1 }).getByRole('link', { name: 'Info' }).click();
		await page.getByText('Members of the group').waitFor();
		for (const user of availableUsers) {
			const userBadge = page.getByRole('link', { name: user, exact: true });
			await expect(userBadge).toBeVisible();
		}
	});

	let group2, group3;
	await test.step('Create other 2 test groups', async () => {
		group2 = await createTestGroup(page);
		group3 = await createTestGroup(page);
	});

	const groupBadges = page.locator('.row', { hasText: 'Groups' }).locator('.badge');
	let initialGroupBadgesCount;

	await test.step('Open user editing page', async () => {
		await page.goto('/v2/admin/users');
		await waitPageLoading(page);
		await page.getByRole('row', { name: user1 }).getByRole('link', { name: 'Edit' }).click();
		await waitPageLoading(page);
		const currentGroups = await groupBadges.allInnerTexts();
		initialGroupBadgesCount = await groupBadges.count();
		expect(currentGroups.includes('All')).toBeTruthy();
		expect(currentGroups.includes(group1)).toBeTruthy();
	});

	let selectableGroups1;
	await test.step('Select group2 from "Add group" modal', async () => {
		await page.getByRole('button', { name: 'Add group' }).click();
		const modal = page.locator('.modal.show');
		await modal.waitFor();
		selectableGroups1 = await page.getByRole('option').count();
		await selectSlimSelect(page, page.getByLabel('Select groups'), group2, true);
		await modal.getByRole('button', { name: 'Add' }).click();
		await waitModalClosed(page);
		await expect(groupBadges).toHaveCount(initialGroupBadgesCount + 1);
	});

	await test.step('Reopen modal and check options', async () => {
		await page.getByRole('button', { name: 'Add group' }).click();
		const modal = page.locator('.modal.show');
		await modal.waitFor();
		const selectableGroups2 = await page.getByRole('option').count();
		expect(selectableGroups2).toEqual(selectableGroups1 - 1);
		await modal.getByRole('button', { name: 'Cancel' }).click();
		await waitModalClosed(page);
	});

	await test.step('Remove group2 from groups to add', async () => {
		await page.getByLabel(`Remove group ${group2}`).click();
		await expect(groupBadges).toHaveCount(initialGroupBadgesCount);
	});

	let finalCount;
	await test.step('Reopen modal and group2 again and group3', async () => {
		await page.getByRole('button', { name: 'Add group' }).click();
		const modal = page.locator('.modal.show');
		await modal.waitFor();
		const selectableGroups = await page.getByRole('option').allInnerTexts();
		expect(selectableGroups.length).toEqual(selectableGroups1);
		for (let group of [group2, group3].sort()) {
			await selectSlimSelect(page, page.getByLabel('Select groups'), group, true);
		}
		await modal.getByRole('button', { name: 'Add' }).click();
		await waitModalClosed(page);
		finalCount = initialGroupBadgesCount + 2;
		await expect(groupBadges).toHaveCount(finalCount);
	});

	await test.step('Save and check', async () => {
		await page.getByRole('button', { name: 'Save' }).first().click();
		await expect(page.getByText('User successfully updated')).toBeVisible();
		await page.goto('/v2/admin/users');
		await waitPageLoading(page);
		await page.getByRole('row', { name: user1 }).getByRole('link', { name: 'Info' }).click();
		await waitPageLoading(page);
		await expect(page.getByRole('row', { name: 'Groups' }).getByRole('link')).toHaveCount(
			finalCount
		);
	});

	await test.step('Attempt to create a group using the name of an existing group', async () => {
		await page.goto('/v2/admin/groups');
		await waitPageLoading(page);
		await page.getByRole('button', { name: 'Create new group' }).click();
		const modal = page.locator('.modal.show');
		await modal.waitFor();
		await modal.getByRole('textbox', { name: 'Group name' }).fill(group1);
		await modal.getByRole('button', { name: 'Create' }).click();
		await expect(modal.getByText('A group with the same name already exists')).toBeVisible();
		await modal.getByRole('button', { name: 'Cancel' }).click();
		await waitModalClosed(page);
	});
});

/**
 * @param {import('@playwright/test').Page} page
 * @returns {Promise<string>}
 */
async function createTestUser(page) {
	const randomEmail = Math.random().toString(36).substring(7) + '@example.com';
	await page.goto('/v2/admin/users/register');
	await waitPageLoading(page);
	await page.getByRole('textbox', { name: 'E-mail' }).fill(randomEmail);
	await page.getByLabel('Password', { exact: true }).fill('test');
	await page.getByLabel('Confirm password').fill('test');
	await page.getByRole('button', { name: 'Save' }).click();
	await page.waitForURL(/\/v2\/admin\/users\/\d+\/edit/);
	await waitPageLoading(page);
	return randomEmail;
}

/**
 * @param {import('@playwright/test').Page} page
 * @returns {Promise<string>}
 */
async function createTestGroup(page) {
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
