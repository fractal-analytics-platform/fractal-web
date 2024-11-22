import { expect, test } from '@playwright/test';
import { waitPageLoading } from './utils.js';
import path from 'path';
import fs from 'fs/promises';
import os from 'os';

test('Download token test', async ({ page }) => {
	await page.goto('/profile');
	await waitPageLoading(page);
	await page.getByRole('button', { name: 'admin@fractal.xy' }).click();
	const downloadPromise = page.waitForEvent('download');
	await page.getByRole('link', { name: 'Download token' }).click();
	const download = await downloadPromise;
	const file = path.join(os.tmpdir(), download.suggestedFilename());
	await download.saveAs(file);
	const data = (await fs.readFile(file)).toString();
	expect(data.length).toBeGreaterThan(0);
	await fs.rm(file);
});
