import { expect, test } from '@playwright/test';
import { waitPageLoading } from './utils.js';

// Reset storage state for this file to avoid being authenticated
test.use({ storageState: { cookies: [], origins: [] } });

test('Login and Logout', async ({ page }) => {
	await page.goto('/');
	expect(await page.textContent('h1')).toBe('Welcome to Fractal web client.');

	await page.getByRole('link', { name: 'Login' }).first().click();

	await waitPageLoading(page);
	await login(page);

	await expect(page.getByText('admin@fractal.xy')).toHaveCount(1);

	await page.goto('/');
	await expect(page.getByText('Login')).toHaveCount(0);

	await page.goto('/auth/login');
	await expect(page.getByText('You are already logged in, click here to log out.')).toHaveCount(1);

	await page.getByRole('button', { name: 'admin@fractal.xy' }).click();
	await page.getByRole('link', { name: 'Logout' }).click();
	await page.waitForURL('/');

	await expect(page.getByText('admin@fractal.xy')).toHaveCount(0);
	await expect(page.getByText('Login')).toHaveCount(2);
});

test.describe(() => {
	test('Loading SSR page with expired cookied', async ({ page }) => {
		await page.goto('/auth/login');
		await login(page);
		await page.context().clearCookies();
		await page.getByRole('link', { name: 'Tasks' }).click();
		await page.waitForURL('/auth/login?invalidate=true');
		await verifySessionExpiredMessage(page);
	});

	test('Reloading SSR page with expired cookied', async ({ page }) => {
		await page.goto('/auth/login');
		await login(page);
		await page.context().clearCookies();
		await page.reload();
		await page.waitForURL('/auth/login?invalidate=true');
		await verifySessionExpiredMessage(page);
	});

	test('Loading AJAX request with expired cookied', async ({ page }) => {
		await page.goto('/auth/login');
		await login(page);
		await page.context().clearCookies();
		await page.getByRole('button', { name: 'Create new project' }).click();
		let modalTitle = page.locator('.modal.show .modal-title');
		await modalTitle.waitFor();
		const projectNameInput = page.getByLabel('Project name');
		await projectNameInput.fill('unauthorized');
		const createProjectBtn = page.locator('.modal.show').getByRole('button', { name: 'Create' });
		await createProjectBtn.click();
		await page.waitForURL('/auth/login?invalidate=true');
		await verifySessionExpiredMessage(page);
	});
});

/**
 * @param {import('@playwright/test').Page} page
 */
async function verifySessionExpiredMessage(page) {
	await page.waitForFunction(() => {
		const warning = document.querySelector('.alert-warning');
		return warning instanceof HTMLElement && warning.innerText.includes('Session expired');
	});
}

/**
 * @param {import('@playwright/test').Page} page
 */
async function login(page) {
	await waitPageLoading(page);
	await page.getByLabel('Email address').fill('admin@fractal.xy');
	await page.getByLabel('Password').fill('1234');
	await page.getByRole('button', { name: 'Submit' }).click();
	await page.waitForURL('/v2/projects');
}
