import { expect, test } from '@playwright/test';
import {
	closeModal,
	createProject,
	deleteProject,
	expectBooleanIcon,
	login,
	logout,
	shareProjectByName,
	waitModal,
	waitModalClosed,
	waitPageLoading
} from '../utils.js';
import { createTestUser } from './user_utils.js';

// Reset storage state for this file to avoid being authenticated
test.use({ storageState: { cookies: [], origins: [] } });

test('Project sharing', async ({ page }) => {
	await login(page, 'admin@fractal.xy', '1234');
	await waitPageLoading(page);

	const userEmail = await createTestUser(page);

	const projectToAccept = (await createProject(page)).name;
	const projectToReject = (await createProject(page)).name;
	const projectToLeave = (await createProject(page)).name;

	await test.step('Open sharing page for project 1', async () => {
		await page.goto('/v2/projects');
		await waitPageLoading(page);

		await page
			.getByRole('row', { name: projectToAccept })
			.getByRole('link', { name: 'Sharing' })
			.click();
		await page.waitForURL(/\/v2\/projects\/\d+\/sharing/);
		await waitPageLoading(page);

		await expect(page.getByText('This project has not been shared with anyone yet.')).toBeVisible();
	});

	await test.step('Attempt to share project with non-existing user', async () => {
		await page.getByRole('textbox', { name: 'User e-mail' }).fill('not-existing@example.com');
		await page.getByRole('combobox', { name: 'Permission' }).selectOption('Read');
		await page.getByRole('button', { name: 'Share' }).click();
		await expect(page.getByText('User not found.')).toBeVisible();
	});

	await test.step('Share project', async () => {
		await page.getByRole('textbox', { name: 'User e-mail' }).fill(userEmail);
		await page.getByRole('button', { name: 'Share' }).click();
		await expect(
			page.getByText('This project has not been shared with anyone yet.')
		).not.toBeVisible();

		const row = page.getByRole('row', { name: userEmail });
		await expect(row).toBeVisible();
		await expectBooleanIcon(row.getByRole('cell').nth(1), false);
		await expectBooleanIcon(row.getByRole('cell').nth(2), true);
		await expectBooleanIcon(row.getByRole('cell').nth(3), false);
		await expectBooleanIcon(row.getByRole('cell').nth(4), false);
	});

	await test.step('Edit sharing options', async () => {
		const row = page.getByRole('row', { name: userEmail });
		await row.getByRole('button', { name: 'Edit' }).click();
		const modal = await waitModal(page);
		await modal.getByRole('combobox', { name: 'Permission' }).selectOption('Read, Write');
		await modal.getByRole('button', { name: 'Save' }).click();
		await waitModalClosed(page);
		await expectBooleanIcon(row.getByRole('cell').nth(2), true);
		await expectBooleanIcon(row.getByRole('cell').nth(3), true);
		await expectBooleanIcon(row.getByRole('cell').nth(4), false);
	});

	await test.step('Share project 2', async () => {
		await shareProjectByName(page, projectToReject, userEmail, 'Read');
		const row = page.getByRole('row', { name: userEmail });
		await expectBooleanIcon(row.getByRole('cell').nth(1), false);
		await expectBooleanIcon(row.getByRole('cell').nth(2), true);
		await expectBooleanIcon(row.getByRole('cell').nth(3), false);
		await expectBooleanIcon(row.getByRole('cell').nth(4), false);
	});

	await test.step('Share project 3', async () => {
		await shareProjectByName(page, projectToLeave, userEmail, 'Read, Write, Execute');
		const row = page.getByRole('row', { name: userEmail });
		await expectBooleanIcon(row.getByRole('cell').nth(1), false);
		await expectBooleanIcon(row.getByRole('cell').nth(2), true);
		await expectBooleanIcon(row.getByRole('cell').nth(3), true);
		await expectBooleanIcon(row.getByRole('cell').nth(4), true);
	});

	await test.step('Login as other user and accept/reject projects', async () => {
		await logout(page, 'admin@fractal.xy');
		await login(page, userEmail, 'test');

		await expect(page.locator('.alert')).toHaveCount(3);

		const alert1 = page.locator('.alert', { has: page.getByText(projectToAccept) });
		await expect(alert1).toContainText(
			`User admin@fractal.xy wants to share project "${projectToAccept}" with you`
		);
		await alert1.getByRole('button', { name: 'Accept' }).click();

		await expect(page.locator('.alert')).toHaveCount(2);

		const alert2 = page.locator('.alert', { has: page.getByText(projectToReject) });
		await expect(alert2).toContainText(
			`User admin@fractal.xy wants to share project "${projectToReject}" with you`
		);
		await alert2.getByRole('button', { name: 'Reject' }).click();

		await expect(page.locator('.alert')).toHaveCount(1);

		const alert3 = page.locator('.alert', { has: page.getByText(projectToLeave) });
		await expect(alert3).toContainText(
			`User admin@fractal.xy wants to share project "${projectToLeave}" with you`
		);
		await alert3.getByRole('button', { name: 'Accept' }).click();

		await expect(page.locator('.alert')).toHaveCount(0);
	});

	await test.step('Check shared projects', async () => {
		await page.getByRole('button', { name: 'Shared with me' }).click();
		const acceptedRow1 = page.getByRole('row', { name: projectToAccept });
		const acceptedRow2 = page.getByRole('row', { name: projectToLeave });
		await expect(acceptedRow1).toBeVisible();
		await expect(acceptedRow2).toBeVisible();
		await expect(page.getByRole('row', { name: projectToReject })).not.toBeVisible();

		await acceptedRow1.getByRole('button', { name: 'Info' }).click();
		const modal1 = await waitModal(page);
		await expect(modal1.getByText('admin@fractal.xy')).toBeVisible();
		await expect(modal1.getByText('Read, Write')).toBeVisible();
		await closeModal(page);

		await acceptedRow2.getByRole('button', { name: 'Info' }).click();
		const modal2 = await waitModal(page);
		await expect(modal2.getByText('admin@fractal.xy')).toBeVisible();
		await expect(modal2.getByText('Read, Write, Execute')).toBeVisible();
		await closeModal(page);
	});

	await test.step('Check info button inside project', async () => {
		await page.getByRole('link', { name: projectToAccept }).click();
		await page.waitForURL(/\/v2\/projects\/\d+/);
		await waitPageLoading(page);
		await page.getByRole('button', { name: 'Info' }).click();
		const modal = await waitModal(page);
		await expect(modal.getByText('admin@fractal.xy')).toBeVisible();
		await closeModal(page);
	});

	await test.step('Leave project', async () => {
		await page.goto('/v2/projects');
		await waitPageLoading(page);
		await page.getByRole('button', { name: 'Shared with me' }).click();
		const row = page.getByRole('row', { name: projectToLeave });
		await row.getByRole('button', { name: 'Leave' }).click();
		const modal = await waitModal(page);
		await modal.getByRole('button', { name: 'Confirm' }).click();
		await waitModalClosed(page);
		await expect(row).not.toBeVisible();
	});

	await test.step('Login as admin again', async () => {
		await logout(page, userEmail);
		await login(page, 'admin@fractal.xy', '1234');
	});

	await test.step('Check project 1', async () => {
		await page
			.getByRole('row', { name: projectToAccept })
			.getByRole('link', { name: 'Sharing' })
			.click();

		await page.waitForURL(/\/v2\/projects\/\d+\/sharing/);
		await waitPageLoading(page);

		const row = page.getByRole('row', { name: userEmail });
		await expect(row).toBeVisible();
		await expectBooleanIcon(row.getByRole('cell').nth(1), true);
		await expectBooleanIcon(row.getByRole('cell').nth(2), true);
		await expectBooleanIcon(row.getByRole('cell').nth(3), true);
		await expectBooleanIcon(row.getByRole('cell').nth(4), false);
	});

	await test.step('Delete project 1 sharing', async () => {
		const row = page.getByRole('row', { name: userEmail });
		await row.getByRole('button', { name: 'Revoke access' }).click();
		const modal = await waitModal(page);
		await modal.getByRole('button', { name: 'Confirm' }).click();
		await waitModalClosed(page);
		await expect(row).not.toBeVisible();
	});

	await test.step('Check project 2', async () => {
		await page.goto('/v2/projects');
		await waitPageLoading(page);
		await page
			.getByRole('row', { name: projectToReject })
			.getByRole('link', { name: 'Sharing' })
			.click();
		await page.waitForURL(/\/v2\/projects\/\d+\/sharing/);
		await waitPageLoading(page);
		await expect(page.getByText('This project has not been shared with anyone yet.')).toBeVisible();
	});

	await test.step('Check project 3', async () => {
		await page.goto('/v2/projects');
		await waitPageLoading(page);
		await page
			.getByRole('row', { name: projectToLeave })
			.getByRole('link', { name: 'Sharing' })
			.click();
		await page.waitForURL(/\/v2\/projects\/\d+\/sharing/);
		await waitPageLoading(page);
		await expect(page.getByText('This project has not been shared with anyone yet.')).toBeVisible();
	});

	await test.step('Check sharing button inside project', async () => {
		await page.goto('/v2/projects');
		await waitPageLoading(page);
		await page.getByRole('link', { name: projectToAccept }).click();
		await page.waitForURL(/\/v2\/projects\/\d+/);
		await waitPageLoading(page);
		await page.getByRole('link', { name: 'Sharing' }).click();
		await page.waitForURL(/\/v2\/projects\/\d+\/sharing/);
	});

	await test.step('Cleanup', async () => {
		await deleteProject(page, projectToAccept);
		await deleteProject(page, projectToReject);
		await deleteProject(page, projectToLeave);
	});
});
