import { expect, test } from '@playwright/test';
import { selectSlimSelect, waitModalClosed, waitPageLoading } from '../../../utils/utils.js';
import { addGroupToUser, createTestUser } from '../../../utils/v2/user.js';
import { addUserToGroup, createTestGroup, deleteGroup } from '../../../utils/group.js';

test('Admin groups management', async ({ page }) => {
	const user1 = await createTestUser(page);
	const group1 = await createTestGroup(page);

	await test.step('Add the test user the group', async () => {
		await page.goto(`/v2/admin/groups/${group1.id}/edit`);
		await waitPageLoading(page);
		await addUserToGroup(page, user1.email);
	});

	await test.step('Check group info page', async () => {
		await page.goto('/v2/admin/groups');
		await waitPageLoading(page);
		await page.getByRole('row', { name: group1.name }).getByRole('link', { name: 'Info' }).click();
		await expect(page.getByText('Members of the group')).toBeVisible();
		const userBadge = page.getByRole('link', { name: user1.email, exact: true });
		await expect(userBadge).toBeVisible();
	});

	// Create other 2 test groups
	const group2 = await createTestGroup(page);
	const group3 = await createTestGroup(page);

	const groupBadges = page.locator('.row', { hasText: 'Groups' }).locator('.badge');
	let initialGroupBadgesCount;

	await test.step('Open user editing page', async () => {
		await page.goto('/v2/admin/users');
		await waitPageLoading(page);
		await page.getByRole('row', { name: user1.email }).getByRole('link', { name: 'Edit' }).click();
		await page.waitForURL(/\/v2\/admin\/users\/\d+\/edit/);
		await waitPageLoading(page);
		const currentGroups = (await groupBadges.allInnerTexts()).map(
			// extract the group name from the element without the removal button text content
			(t) => /** @type {RegExpMatchArray} */ (t.match(/^\S+/))[0]
		);
		initialGroupBadgesCount = await groupBadges.count();
		expect(currentGroups.includes('All')).toBeTruthy();
		expect(currentGroups.includes(group1.name)).toBeTruthy();
	});

	let selectableGroups1;
	await test.step('Select group2 from "Add group" modal', async () => {
		selectableGroups1 = await addGroupToUser(page, group2.name);
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
		await page.getByLabel(`Remove group ${group2.name}`).click();
		await expect(groupBadges).toHaveCount(initialGroupBadgesCount);
	});

	let finalCount;
	await test.step('Reopen modal and group2 again and group3', async () => {
		await page.getByRole('button', { name: 'Add group' }).click();
		const modal = page.locator('.modal.show');
		await modal.waitFor();
		const selectableGroups = await page.getByRole('option').allInnerTexts();
		expect(selectableGroups.length).toEqual(selectableGroups1);
		for (let group of [group2, group3].sort((g1, g2) => g1.name.localeCompare(g2.name))) {
			await selectSlimSelect(
				page,
				page.getByRole('combobox', { name: 'Select groups' }),
				group.name,
				true
			);
		}
		// Await slim-select change events are propagated before clicking the Add button
		await new Promise((r) => setTimeout(r, 500));
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
		await page.getByRole('row', { name: user1.email }).getByRole('link', { name: 'Info' }).click();
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
		await modal.getByRole('textbox', { name: 'Group name' }).fill(group1.name);
		await modal.getByRole('button', { name: 'Create' }).click();
		await expect(modal.getByText('A group with the same name already exists')).toBeVisible();
		await modal.getByRole('button', { name: 'Cancel' }).click();
		await waitModalClosed(page);
	});

	await test.step('Remove user from group1 by editing group', async () => {
		await page.goto('/v2/admin/groups');
		await waitPageLoading(page);
		await page.getByRole('row', { name: group1.name }).getByRole('link', { name: 'Edit' }).click();
		await waitPageLoading(page);
		const container = page.locator('#members-container');
		await expect(container).toContainText(user1.email);
		await page.getByLabel(`Remove user ${user1.email}`).click();
		await expect(container).not.toContainText(user1.email);
	});

	await test.step('Delete test groups', async () => {
		await deleteGroup(page, group1.id);
		await deleteGroup(page, group2.id);
		await deleteGroup(page, group3.id);
	});
});
