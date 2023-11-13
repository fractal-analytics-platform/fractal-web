import { expect, test } from './base_test.js';

// Reset storage state for this file to avoid being authenticated
test.use({ storageState: { cookies: [], origins: [] } });

test('Login and Logout', async ({ page }) => {
	await page.goto('/');
	expect(await page.textContent('h1')).toBe('Welcome to Fractal web client.');

	await page.getByRole('link', { name: 'Login' }).first().click();

	await page.waitForURL('/auth/login');
	await login(page);

	await expect(page.getByText('admin@fractal.xy')).toHaveCount(1);

	await page.goto('/');
	await expect(page.getByText('Login')).toHaveCount(0);

	await page.goto('/auth/login');
	await expect(page.getByText('You are already logged in, click here to log out.')).toHaveCount(1);

	await page.getByRole('link', { name: 'Logout' }).click();
	await page.waitForURL('/');

	await expect(page.getByText('admin@fractal.xy')).toHaveCount(0);
	await expect(page.getByText('Login')).toHaveCount(2);
});

test('Loading SSR page with expired cookied', async ({ page }) => {
	await page.goto('/auth/login');
	await login(page);
	await page.context().clearCookies();
	await page.getByRole('link', { name: 'Tasks' }).click();
	await page.waitForSelector('text=Session expired. Please login again.');
});

test('Reloading SSR page with expired cookied', async ({ page }) => {
	await page.goto('/auth/login');
	await login(page);
	await page.context().clearCookies();
	await page.reload();
	await page.waitForSelector('text=Session expired. Please login again.');
});

test('Loading AJAX request with expired cookied', async ({ page }) => {
	await page.goto('/auth/login');
	await login(page);
	await page.context().clearCookies();
	const projectNameInput = page.locator('[name="projectName"]');
	await projectNameInput.fill('unauthorized');
	await projectNameInput.blur();
	const createProjectBtn = page.getByRole('button', { name: 'Create new project' });
	await createProjectBtn.waitFor();
	await createProjectBtn.click();
	await page.waitForSelector('text=Session expired. Please login again.');
});

/**
 * @param {import('@playwright/test').Page} page
 */
async function login(page) {
	await page.getByLabel('Email address').fill('admin@fractal.xy');
	await page.getByLabel('Password').fill('1234');
	await page.getByRole('button', { name: 'Submit' }).click();
	await page.waitForURL('/projects');
}
