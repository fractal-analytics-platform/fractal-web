import { expect, test } from '@playwright/test';
import { waitPageLoading } from '../utils.js';

// Reset storage state for this file to avoid being authenticated
test.use({ storageState: { cookies: [], origins: [] } });

test('Login as default guest user', async ({ page }) => {

    await page.goto('/auth/login');
    await waitPageLoading(page);

    await page.getByRole('button', { name: 'Log in as guest' }).click();
    await waitPageLoading(page);

    // Verify that "Shared with me tab" is selected
    await expect(page.getByText('There are currently no projects shared with you')).toBeVisible();
});
