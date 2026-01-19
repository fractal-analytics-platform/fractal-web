import { expect, test } from '@playwright/test';
import { waitPageLoading } from '../utils.js';
import { createTestUser, verifyChecked } from './user_utils.js';

test('Guest user', async ({ page }) => {
    await waitPageLoading(page);
    const userEmail = await createTestUser(page);
    let userId;

    await test.step('Verify new user is not a guest', async () => {
        await page.goto('/v2/admin/users');
        await waitPageLoading(page);
        const userRow = await page.getByRole('row', { 'name': userEmail }).getByRole('cell').all();
        await verifyChecked(userRow, 5, false);
        userId = await userRow[0].textContent();
    })

    await test.step("Make the user a guest", async () => {
        await page.goto(`/v2/admin/users/${userId}/edit`);
        await waitPageLoading(page);
        await page.getByRole('checkbox', { name: 'Guest' }).check();
        await page.getByRole('button', { name: 'Save' }).click();
        await expect(page.getByText('User successfully updated')).toBeVisible();
    })

    await test.step('Verify new user is now a guest', async () => {
        await page.goto('/v2/admin/users');
        await waitPageLoading(page);
        const userRow = await page.getByRole('row', { 'name': userEmail }).getByRole('cell').all();
        await verifyChecked(userRow, 5, true);
    })

    await test.step("Verify superuser cannot be guest", async () => {
        await page.goto(`/v2/admin/users/${userId}/edit`);
        await waitPageLoading(page);
        await page.getByRole('checkbox', { name: 'Superuser' }).check();
        await page.getByRole('button', { name: 'Save' }).click();
        await page.getByRole('button', { name: 'Confirm' }).click();
        await expect(page.getByText('Superuser cannot be guest.')).toBeVisible();

        await page.getByRole('checkbox', { name: 'Guest' }).uncheck();
        await page.getByRole('button', { name: 'Save' }).click();
        await page.getByRole('button', { name: 'Confirm' }).click();;
        await expect(page.getByText('User successfully updated')).toBeVisible();
    })
})
