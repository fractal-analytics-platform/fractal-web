import { expect, test } from '@playwright/test';
import {
	createProject,
	deleteProject,
	expectBooleanIcon,
	login,
	logout,
	shareProjectByName,
	waitPageLoading
} from '../utils.js';
import { createTestUser, createGuestUser } from './user_utils.js';

// Reset storage state for this file to avoid being authenticated
test.use({ storageState: { cookies: [], origins: [] } });

test('Admin page for project sharing', async ({ page }) => {
	await login(page, 'admin@fractal.xy', '1234');
	await waitPageLoading(page);

	const userEmail1 = await createTestUser(page);
	const userEmail2 = await createTestUser(page);

	const userEmail3 = await createGuestUser(page);

	const p1 = await createProject(page);
	const p2 = await createProject(page);

	await test.step('Share project 1', async () => {
		await shareProjectByName(page, p1.name, userEmail1, 'Read');
		const row = page.getByRole('row', { name: userEmail1 });
		await expectBooleanIcon(row.getByRole('cell').nth(1), false);
		await expectBooleanIcon(row.getByRole('cell').nth(2), true);
		await expectBooleanIcon(row.getByRole('cell').nth(3), false);
		await expectBooleanIcon(row.getByRole('cell').nth(4), false);
	});

	await test.step('Share project 2', async () => {
		await shareProjectByName(page, p2.name, userEmail2, 'Read, Write');
		const row = page.getByRole('row', { name: userEmail2 });
		await expectBooleanIcon(row.getByRole('cell').nth(1), false);
		await expectBooleanIcon(row.getByRole('cell').nth(2), true);
		await expectBooleanIcon(row.getByRole('cell').nth(3), true);
		await expectBooleanIcon(row.getByRole('cell').nth(4), false);
	});

	await test.step('Share project 1 with guest user', async () => {
		await shareProjectByName(page, p1.name, userEmail3, 'Read');
		const row = page.getByRole('row', { name: userEmail3 });
		await expectBooleanIcon(row.getByRole('cell').nth(1), false);
		await expectBooleanIcon(row.getByRole('cell').nth(2), true);
		await expectBooleanIcon(row.getByRole('cell').nth(3), false);
		await expectBooleanIcon(row.getByRole('cell').nth(4), false);
	});

	await test.step('Login as other user and accept project', async () => {
		await logout(page, 'admin@fractal.xy');
		await login(page, userEmail1, 'test');
		const alert1 = page.locator('.alert', { has: page.getByText(p1.name) });
		await expect(alert1).toContainText(
			`User admin@fractal.xy wants to share project "${p1.name}" with you`
		);
		await alert1.getByRole('button', { name: 'Accept' }).click();
		await expect(page.locator('.alert')).not.toBeVisible();
	});

	await test.step('Login as admin again and check sharing page', async () => {
		await logout(page, userEmail1);
		await login(page, 'admin@fractal.xy', '1234');
		await page.goto('/v2/admin');
		await waitPageLoading(page);
		await page.getByRole('link', { name: 'Projects sharing' }).click();
		await waitPageLoading(page);
	});

	await test.step('Test search fields', async () => {
		await page.getByRole('spinbutton', { name: 'Project Id' }).fill(p1.id);
		await search(page, 3);
    	await expect(page.getByRole('row', {name: p1.name})).toHaveCount(3);
		await reset(page);

		await page.getByRole('combobox', { name: 'User' }).selectOption(userEmail2);
		await search(page, 1);
    	await expect(page.getByRole('row', {name: p2.name})).toBeVisible();
		await reset(page);

		await page.getByRole('combobox', { name: 'User' }).selectOption(userEmail1);
		await page.getByRole('combobox', { name: 'Is Verified' }).selectOption('True');
		await search(page, 1);
    	await expect(page.getByRole('row', {name: p1.name})).toBeVisible();
		await reset(page);

		await page.getByRole('combobox', { name: 'User' }).selectOption(userEmail2);
		await page.getByRole('combobox', { name: 'Is Verified' }).selectOption('False');
		await search(page, 1);
    	await expect(page.getByRole('row', {name: p2.name})).toBeVisible();
		await reset(page);

		await page.getByRole('spinbutton', { name: 'Project Id' }).fill(p1.id);
		await page.getByRole('combobox', { name: 'User' }).selectOption('admin@fractal.xy');
		await page.getByRole('combobox', { name: 'Is Owner' }).selectOption('True');
		await search(page, 1);
    	await expect(page.getByRole('row', {name: p1.name})).toBeVisible();
		await reset(page);

		await page.getByRole('spinbutton', { name: 'Project Id' }).fill(p1.id);
		await page.getByRole('combobox', { name: 'User' }).selectOption('admin@fractal.xy');
		await page.getByRole('combobox', { name: 'Is Owner' }).selectOption('False');
		await search(page, 0);
		await reset(page);
	});

	await test.step('Test Verify button', async () => {
		await page.getByRole('spinbutton', { name: 'Project Id' }).fill(p1.id);
		await search(page, 3);
    	await expect(page.getByRole('row', {name: p1.name})).toHaveCount(3);
		// for non-guests users there is no Verify button
		const row1 = page.getByRole('row', { name: userEmail1 });
		await expect(row1.getByRole('button', { name: 'Verify' })).toHaveCount(0);
		const row2 = page.getByRole('row', { name: userEmail2 });
		await expect(row2.getByRole('button', { name: 'Verify' })).toHaveCount(0);
		// for guest users there is the Verify button
		const row3 = page.getByRole('row', { name: userEmail3 });
		//  click the Verify button and assert link is verified
		await expectBooleanIcon(row3.getByRole('cell').nth(4), false);
		await row3.getByRole('button', { name: 'Verify' }).click();
		await page.waitForTimeout(100);
		await expectBooleanIcon(row3.getByRole('cell').nth(4), true);
	});

	await test.step('Cleanup', async () => {
    await deleteProject(page, p1.name);
    await deleteProject(page, p2.name);
  });
});

/**
 * @param {import('@playwright/test').Page} page
 * @param {number} expectedRowCount
 */
async function search(page, expectedRowCount) {
	await page.getByRole('button', { name: 'Search' }).click();
  if (expectedRowCount === 0) {
    await expect(page.getByText('The query returned 0 matching results')).toBeVisible();
  } else {
    await expect(page.getByRole('row')).toHaveCount(expectedRowCount + 1);
  }
}

/**
 * @param {import('@playwright/test').Page} page
 */
async function reset(page) {
	await page.getByRole('button', { name: 'Reset' }).click();
	await expect(page.getByRole('row')).toHaveCount(0);
}
