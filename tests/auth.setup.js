import { test as setup } from '@playwright/test';
import { waitPageLoading } from './utils.js';

const authFile = 'tests/.auth/user.json';

setup('authentication', async ({ page }) => {
	await page.goto('/auth/login');
	await waitPageLoading(page);
	await page.getByRole('button', { name: 'Log in with username & password' }).click();
	await page.getByLabel('Email address').fill('admin@fractal.xy');
	await page.getByLabel('Password').fill('1234');
	await page.getByRole('button', { name: 'Login' }).click();

	await page.waitForURL('/v2/projects');

	await page.context().storageState({ path: authFile });
});