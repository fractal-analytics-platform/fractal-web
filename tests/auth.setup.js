import { test as setup } from '@playwright/test';
import { waitPageLoading } from './base_test';

const authFile = 'tests/.auth/user.json';

setup('authentication', async ({ page }) => {
	await page.goto('/auth/login');
	await waitPageLoading(page);
	await page.getByLabel('Email address').fill('admin@fractal.xy');
	await page.getByLabel('Password').fill('1234');
	await page.getByRole('button', { name: 'Submit' }).click();

	await page.waitForURL('/projects');

	await page.context().storageState({ path: authFile });
});