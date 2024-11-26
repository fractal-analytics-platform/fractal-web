import { expect, test } from '@playwright/test';
import { selectSlimSelect, waitModalClosed } from '../utils.js';
import { addGroupToUser, createTestUser } from './user_utils.js';
import { addUserToGroup, createTestGroup, deleteGroup } from './group_utils.js';

test('Import user settings from another user', async ({ page }) => {
	let user1;
	await test.step('Create test user1', async () => {
		user1 = await createTestUser(page);
	});

	await test.step('Fill user1 settings', async () => {
		await page.getByRole('textbox', { name: 'Project dir' }).fill('/test/import/proj_dir');
		await page.getByRole('textbox', { name: 'SLURM user' }).fill('test-import-slurm-user');
		await page.getByRole('textbox', { name: 'Cache dir' }).fill('/test/import/cache_dir');
		await page.getByRole('button', { name: 'Add SLURM account' }).click();
		await page.getByLabel('SLURM account #1', { exact: true }).fill('test-import-slurm-account');
		await page.getByRole('button', { name: 'Save' }).click();
	});

	let group;
	await test.step('Create test group', async () => {
		group = await createTestGroup(page);
	});

	await test.step('Add the test user1 the group', async () => {
		await addUserToGroup(page, user1);
	});

	await test.step('Create test user2', async () => {
		await createTestUser(page);
	});

	await test.step('Add test group to user2', async () => {
		await addGroupToUser(page, group);
	});

	await test.step('Import settings from user1', async () => {
		await expect(page.getByRole('textbox', { name: 'Project dir' })).toHaveValue('');
		await page.getByRole('button', { name: 'Import from another user' }).click();
		const modal = page.locator('.modal.show');
		await modal.waitFor();
		await selectSlimSelect(page, modal.getByLabel('Select user'), user1);
		await modal.getByRole('button', { name: 'Import settings' }).click();
		if (await modal.getByText('User is required').isVisible()) {
			// Sometimes playwright clicks the "Import settings" button before the slim-select
			// change event is propagated; in that case no user is selected and the error appears.
			console.warn('"User is required" message was displayed. Retrying to add user.');
			await modal.getByRole('button', { name: 'Import settings' }).click();
		}
		await waitModalClosed(page);
		await expect(page.getByRole('textbox', { name: 'Project dir' })).toHaveValue(
			'/test/import/proj_dir'
		);
		await expect(page.getByRole('textbox', { name: 'SLURM user' })).toHaveValue(
			'test-import-slurm-user'
		);
		await expect(page.getByRole('textbox', { name: 'Cache dir' })).toHaveValue(
			'/test/import/cache_dir'
		);
		await expect(page.getByLabel('SLURM account #1', { exact: true })).toHaveValue(
			'test-import-slurm-account'
		);
	});

	await test.step('Cleanup test group', async () => {
		await deleteGroup(page, group);
	});
});
