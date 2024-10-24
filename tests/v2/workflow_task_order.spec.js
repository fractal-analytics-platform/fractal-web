import { expect, test } from './workflow_fixture.js';
import { waitModalClosed, waitPageLoading } from '../utils.js';

test('Change workflow task order', async ({ page, workflow }) => {
	await page.waitForURL(workflow.url);
	await waitPageLoading(page);

	await test.step('Add two tasks', async () => {
		await workflow.addTask('create_ome_zarr_compound');
		await workflow.addTask('illumination_correction');
	});

	await test.step('Edit tasks order', async () => {
		await page.getByRole('button', { name: 'Edit tasks order' }).click();
		const modal = page.locator('.modal.show');
		await modal.waitFor();

    const buttons = await modal.getByRole('button').all();
    await expect(buttons[1]).toHaveText(/create_ome_zarr_compound/);
    await expect(buttons[2]).toHaveText(/illumination_correction/);
    
		await modal.getByRole('button', { name: 'create_ome_zarr_compound' }).hover();
		await page.mouse.down();
		await modal.getByRole('button', { name: 'illumination_correction' }).hover();
		await page.mouse.up();

		await modal.getByRole('button', { name: 'Save' }).click();
    await waitModalClosed(page);
	});

  await test.step('Check update', async () => {
    await page.reload();
    await waitPageLoading(page);
    await page.getByRole('button', { name: 'Edit tasks order' }).click();
		const modal = page.locator('.modal.show');
		await modal.waitFor();

    const buttons = await modal.getByRole('button').all();
    await expect(buttons[1]).toHaveText(/illumination_correction/);
    await expect(buttons[2]).toHaveText(/create_ome_zarr_compound/);
  });
});
