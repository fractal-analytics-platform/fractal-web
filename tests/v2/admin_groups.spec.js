import { expect, test } from '@playwright/test';
import { selectSlimSelect, waitModalClosed, waitPageLoading } from '../utils.js';
import { addUserToGroup, createTestGroup, deleteGroup } from './group_utils.js';
import { addGroupToUser, createTestUser } from './user_utils.js';

test('Admin groups management', async ({ page }) => {
	let user1;
	await test.step('Create test user', async () => {
		user1 = await createTestUser(page);
	});

	let group1;
	await test.step('Create test group1', async () => {
		group1 = await createTestGroup(page);
	});

	await test.step('Add the test user the group', async () => {
		await addUserToGroup(page, user1);
	});

	await test.step('Check group info page', async () => {
		await page.goto('/v2/admin/groups');
		await waitPageLoading(page);
		await page.getByRole('row', { name: group1 }).getByRole('link', { name: 'Info' }).click();
		await expect(page.getByText('Members of the group')).toBeVisible();
		const userBadge = page.getByRole('link', { name: user1, exact: true });
		await expect(userBadge).toBeVisible();
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
		await page.waitForURL(/\/v2\/admin\/users\/\d+\/edit/);
		await waitPageLoading(page);
		const currentGroups = (await groupBadges.allInnerTexts()).map(
			// extract the group name from the element without the removal button text content
			(t) => /** @type {RegExpMatchArray} */ (t.match(/^\S+/))[0]
		);
		initialGroupBadgesCount = await groupBadges.count();
		expect(currentGroups.includes('All')).toBeTruthy();
		expect(currentGroups.includes(group1)).toBeTruthy();
	});

	let selectableGroups1;
	await test.step('Select group2 from "Add group" modal', async () => {
		selectableGroups1 = await addGroupToUser(page, group2);
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

	await test.step('Edit user settings in group page', async () => {
		await page.getByRole('row', { name: group1 }).getByRole('link', { name: 'Edit' }).click();
		await waitPageLoading(page);
		await page.getByRole('textbox', { name: 'Project dir' }).fill('/tmp/test/project-dir');
		await page.getByRole('textbox', { name: 'SLURM user' }).fill('test-slurm-user');
		await page.getByRole('textbox', { name: 'Cache dir' }).fill('/tmp/test/cache-dir');
		await page.getByRole('button', { name: 'Add SLURM account' }).click();
		await page.getByLabel('SLURM account #1', { exact: true }).fill('test-slurm-account');
		await page.getByRole('button', { name: 'Save' }).nth(1).click();
		await expect(page.getByText('Settings successfully updated')).toBeVisible();
	});

	await test.step('Check user settings have been updated', async () => {
		await page.goto('/v2/admin/users');
		await waitPageLoading(page);
		await page.getByRole('row', { name: user1 }).getByRole('link', { name: 'Edit' }).click();
		await waitPageLoading(page);
		await expect(page.getByRole('textbox', { name: 'Project dir' })).toHaveValue(
			'/tmp/test/project-dir'
		);
		await expect(page.getByRole('textbox', { name: 'SLURM user' })).toHaveValue('test-slurm-user');
		await expect(page.getByRole('textbox', { name: 'Cache dir' })).toHaveValue(
			'/tmp/test/cache-dir'
		);
		await expect(page.getByLabel('SLURM account #1', { exact: true })).toHaveValue(
			'test-slurm-account'
		);
	});

	await test.step('Remove user from group1 by editing group', async () => {
		await page.goto('/v2/admin/groups');
		await waitPageLoading(page);
		await page.getByRole('row', { name: group1 }).getByRole('link', { name: 'Edit' }).click();
		await waitPageLoading(page);
		const container = page.locator('#members-container');
		await expect(container).toContainText(user1);
		await page.getByLabel(`Remove user ${user1}`).click();
		await expect(container).not.toContainText(user1);
	});

	await test.step('Delete test groups', async () => {
		await deleteGroup(page, group1);
		await deleteGroup(page, group2);
		await deleteGroup(page, group3);
	});
});
