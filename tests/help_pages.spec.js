import { expect } from '@playwright/test';
import { waitModal, waitModalClosed, waitPageLoading } from './utils/utils.js';
import { test } from './base_fixture';

test.beforeEach(async ({ context }) => {
	// Proxying serving of help pages
	await context.route(/help\//, async (route) => {
		const url = route.request().url();
		const response = await context.request.get(url.replace(':5173', ':8001'));
		const body = await response.text();
		await route.fulfill({
			body,
			contentType: response.headers()['content-type']
		});
	});
});

test('Help pages', async ({ page }) => {
	await page.goto('/v2/projects');
	await waitPageLoading(page);

	const frame = page.locator('iframe[title="Help Page"]').contentFrame();
	const projectsLink = frame.getByRole('link', { name: 'Learn more about projects' });
	const projectsHeading = frame.getByRole('heading', { name: /Why projects exist/ });

	await test.step('Check that ESC key works on first page', async () => {
		await page.getByRole('button', { name: 'Help page' }).click();
		await waitModal(page, false);
		await expect(projectsLink).toBeVisible();
		await page.keyboard.press('Escape');
		await waitModalClosed(page);
	});

	await test.step('Check that ESC key works on second page', async () => {
		await page.getByRole('button', { name: 'Help page' }).click();
		await waitModal(page, false);
		await projectsLink.click();
		await expect(projectsHeading).toBeVisible();
		await page.keyboard.press('Escape');
		await waitModalClosed(page);
	});
});
