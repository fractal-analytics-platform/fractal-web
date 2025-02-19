import { test, expect } from '@playwright/test';
import { waitModalClosed, waitPageLoading } from '../utils';

test('Admin task-group activities page', async ({ page }) => {
	await test.step('Open task-group activities page', async () => {
		await page.goto('/v2/admin/task-groups/activities');
		await waitPageLoading(page);
	});

	await test.step('Search fractal-tasks-mock', async () => {
		const searchButton = page.getByRole('button', { name: 'Search activities' });
		await expect(searchButton).toBeEnabled();
		await page.getByRole('textbox', { name: 'Package name' }).fill('fractal-tasks-mock');
		await page.getByRole('combobox', { name: 'Status' }).selectOption('OK');
		await page.getByRole('combobox', { name: 'Action' }).selectOption('Collect');
		await page.getByRole('combobox', { name: 'User' }).selectOption('admin@fractal.xy');
		await searchButton.click();
		await expect(searchButton).toBeEnabled();
		await expect(page.getByText(/The query returned 1 matching result/)).toBeVisible();
	});

	await test.step('Open log modal', async () => {
		await page
			.getByRole('row', { name: 'fractal-tasks-mock' })
			.getByRole('button', { name: 'Show activity log' })
			.click();
		const modal = page.locator('.modal.show');
		await modal.waitFor();
		await expect(modal.getByText('DEBUG').first()).toBeVisible();
		await modal.getByRole('button', { name: 'Close' }).click();
		await waitModalClosed(page);
	});

	await test.step('Reset', async () => {
		await page.getByRole('button', { name: 'Reset' }).click();
		await expect(page.getByText(/The query returned \d+ matching result/)).not.toBeVisible();
		await expect(page.getByRole('textbox', { name: 'Package name' })).toHaveValue('');
		await expect(page.getByRole('combobox', { name: 'Status' })).toHaveValue('');
		await expect(page.getByRole('combobox', { name: 'Action' })).toHaveValue('');
		await expect(page.getByRole('combobox', { name: 'User' })).toHaveValue('');
	});
});
