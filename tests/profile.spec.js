import { expect, test } from '@playwright/test';
import { waitPageLoading } from './utils.js';

test('User profile', async ({ page }) => {
	await test.step('Open user profile page', async () => {
		await page.goto('/');
		await waitPageLoading(page);
		await page.getByRole('button', { name: 'admin@fractal.xy' }).click();
		await page.getByRole('link', { name: 'My profile' }).click();
		await waitPageLoading(page);
		await page.getByText('User ID').waitFor();

		const cells = await page.locator('table td').all();
		expect(await cells[0].innerText()).toEqual('1');
		expect(await cells[2].innerText()).toEqual('admin@fractal.xy');
		expect(await cells[4].innerText()).toEqual('admin');
		verifyChecked(cells, 6, true);
		verifyChecked(cells, 8, true);
		expect(await cells[12].innerText()).toEqual('-');
	});

	await test.step('Add SLURM account (undo)', async () => {
		await page.getByRole('button', { name: 'Edit' }).nth(0).click();
		const addAccountBtn = page.getByRole('button', { name: 'Add SLURM account' });
		await addAccountBtn.waitFor();
		await addAccountBtn.click();
		await addAccountBtn.click();
		const count1 = (await page.getByRole('textbox').all()).length;
		await page.getByRole('button', { name: 'Undo' }).click();
		await page.getByRole('button', { name: 'Edit' }).nth(1).waitFor();
		await page.getByRole('button', { name: 'Edit' }).nth(0).click();
		await addAccountBtn.waitFor();
		const count2 = (await page.getByRole('textbox').all()).length;
		expect(count1 - count2).toEqual(2);
	});

	const randomSlurmAccount = Math.random().toString(36).substring(7);

	await test.step('Add SLURM account (validation error)', async () => {
		const addAccountBtn = page.getByRole('button', { name: 'Add SLURM account' });
		await addAccountBtn.click();
		await addAccountBtn.click();
		const inputs = await page.getByRole('textbox').all();
		await inputs[inputs.length - 2].fill(randomSlurmAccount);
		await inputs[inputs.length - 1].fill(randomSlurmAccount);
		await page.getByRole('button', { name: 'Save' }).click();
		await page.getByText('`slurm_accounts` list has repetitions').waitFor();
	});

	await test.step('Add SLURM account (success)', async () => {
		await page.getByLabel('Remove SLURM account').last().click();
		await page.getByRole('button', { name: 'Save' }).click();
		await page.getByRole('button', { name: 'Edit' }).nth(1).waitFor();
		await page.getByText(randomSlurmAccount).waitFor();
	});

	await test.step('Save cache dir using button', async () => {
		await page.getByRole('button', { name: 'Edit' }).nth(1).click();
		await page.getByRole('textbox').waitFor();
		await page.getByRole('textbox').fill('');
		await page.getByRole('button', { name: 'Save' }).click();
		await page.getByText("String attribute 'cache_dir' cannot be empty").waitFor();
		await page.getByRole('textbox').fill('/tmp/foo1');
		await page.getByRole('button', { name: 'Save' }).click();
		await page.getByRole('button', { name: 'Edit' }).nth(1).waitFor();
	});

	await test.step('Save cache dir using enter', async () => {
		await page.getByRole('button', { name: 'Edit' }).nth(1).click();
		await page.getByRole('textbox').waitFor();
		await page.getByRole('textbox').fill('/tmp/foo2');
		await page.keyboard.down('Enter');
		await page.getByRole('button', { name: 'Edit' }).nth(1).waitFor();
	});

	await test.step('Verify data was updated', async () => {
		await page.reload();
		await waitPageLoading(page);
		const cells = await page.locator('table td').all();
		expect(await cells[14].innerText()).toContain(randomSlurmAccount);
		expect(await cells[16].innerText()).toEqual('/tmp/foo2');
	});
});

/**
 * @param {import('@playwright/test').Locator[]} row
 * @param {number} index
 * @param {boolean} checked
 */
async function verifyChecked(row, index, checked) {
	expect(await row[index].locator('.boolean-icon').getAttribute('aria-checked')).toEqual(
		checked.toString()
	);
}
