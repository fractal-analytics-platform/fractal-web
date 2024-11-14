import { test, expect } from '@playwright/test';
import { waitModalClosed, waitPageLoading } from '../utils';

test('Task-group activities page', async ({ page }) => {
	await test.step('Open task-group activities page', async () => {
		await page.goto('/v2/tasks/activities');
		await waitPageLoading(page);
		const regexResult = /The query returned (\d+) matching result/;
		const resultText = page.getByText(regexResult);
		await expect(resultText).toBeVisible();
		const result = (await resultText.innerText()).match(regexResult);
		if (result === null) {
			expect(result).not.toBeNull();
			return;
		}
		const expectedCount = parseInt(result[1]);
		await expect(page.getByRole('row')).toHaveCount(expectedCount + 1);
	});

	await test.step('Search fractal-tasks-mock', async () => {
		const searchButton = page.getByRole('button', { name: 'Search activities' });
		await expect(searchButton).toBeEnabled();
		await page.getByRole('textbox', { name: 'Package name' }).waitFor();
		await page.getByRole('textbox', { name: 'Package name' }).fill('fractal-tasks-mock');
		await page.getByRole('combobox', { name: 'Status' }).selectOption('OK');
		await page.getByRole('combobox', { name: 'Action' }).selectOption('Collect');
		await searchButton.click();
		await expect(searchButton).toBeEnabled();
		await expect(page.getByText(/The query returned 1 matching result/)).toBeVisible();
		await expect(page.getByRole('row')).toHaveCount(2);
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
		await expect(page.getByRole('textbox', { name: 'Package name' })).toHaveValue('');
		await expect(page.getByRole('combobox', { name: 'Status' })).toHaveValue('');
		await expect(page.getByRole('combobox', { name: 'Action' })).toHaveValue('');
	});
});
