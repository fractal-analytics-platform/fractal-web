import { waitModalClosed } from '../utils';

/**
 * @param {import('@playwright/test').Page} page
 * @param {string} zarrUrl
 * @param {{[key: string]: string}} attributes
 * @param {{[key: string]: boolean}} types
 */
export async function createImage(page, zarrUrl, attributes = {}, types = {}) {
	const newImageBtn = page.getByRole('button', { name: 'Add an image list entry' });
	await newImageBtn.waitFor();
	await newImageBtn.click();
	const modal = page.locator('.modal.show');
	await modal.waitFor();
	await modal.getByRole('textbox', { name: 'Zarr URL' }).fill(zarrUrl);
	for (const [key, value] of Object.entries(attributes)) {
		await modal.getByRole('button', { name: 'Add attribute' }).click();
		await modal.getByPlaceholder('Key').last().fill(key);
		await modal.getByPlaceholder('Value').last().fill(value);
	}
	for (const [key, value] of Object.entries(types)) {
		await modal.getByRole('button', { name: 'Add type' }).click();
		await modal.getByPlaceholder('Key').last().fill(key);
		if (value) {
			await modal.getByRole('switch').last().click();
		}
	}
	await modal.getByRole('button', { name: 'Save' }).click();
	await waitModalClosed(page);
}
