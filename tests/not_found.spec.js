import { expect } from '@playwright/test';
import { test } from './base_fixture';

test('Handles not found pages', async ({ page }) => {
	await page.goto('/foo');
	await expect(page.getByText('Route not found')).toBeVisible();
	await page.goto('/_app/foo');
	await expect(page.getByText('Not found')).toBeVisible();
});
