import { expect, test } from '@playwright/test';
import { waitPageLoading } from '../utils.js';

/**
 * These credentials have to match with the environment variables
 * PUBLIC_GUEST_USERNAME and PUBLIC_GUEST_PASSWORD defined in CI configuration.
 */
const GUEST_USERNAME = 'guest@fractal.xy'
const GUEST_PASSWORD = 'guest'

test('Create default guest user', async ({ page }) => {
    await page.goto('/v2/admin/users');
    await waitPageLoading(page);

    const guestCreated = await page.getByRole('row', { name: GUEST_USERNAME }).isVisible();
    if (guestCreated) {
        console.warn('WARNING: Default guest user already created. Skipping test');
        return;
    }

    await page.goto('/v2/admin/users/register');
    await waitPageLoading(page);

    await page.getByRole('textbox', { name: 'E-mail' }).fill(GUEST_USERNAME);
    await page.getByLabel('Password', { exact: true }).fill(GUEST_PASSWORD);
    await page.getByLabel('Confirm password').fill(GUEST_PASSWORD);
    await page.getByRole('textbox', { name: 'Project dir' }).fill('/tmp');
    await page.getByRole('button', { name: 'Save' }).click();

    await page.waitForURL(/\/v2\/admin\/users\/\d+\/edit/);
    await waitPageLoading(page);
    await page.getByRole('checkbox', { name: 'Guest' }).check();
    await page.getByRole('button', { name: 'Save' }).click();
    await expect(page.getByText('User successfully updated')).toBeVisible();
});