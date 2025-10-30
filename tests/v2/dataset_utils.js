import { expect } from '@playwright/test';
import { waitModalClosed, waitPageLoading } from '../utils';

/**
 * @param {import('@playwright/test').Page} page
 * @param {string} projectId
 * @returns {Promise<{name: string, id: number, zarrDir: string}>} the name and the id of the created dataset
 */
export async function createDataset(page, projectId) {
	await page.goto(`/v2/projects/${projectId}`);
	await waitPageLoading(page);

	const createDatasetButton = page.getByRole('button', { name: 'Create new dataset' });
	await createDatasetButton.click();
	const modal = page.locator('.modal.show');
	await modal.waitFor();

	const randomDatasetName = Math.random().toString(36).substring(7);
	const zarrDir = `/tmp/playwright/datasets/${randomDatasetName}`;

	await modal.getByRole('textbox', { name: 'Dataset Name' }).fill(randomDatasetName);
	await modal.getByRole('button', { name: 'Advanced options' }).click();
	await modal.getByRole('textbox', { name: 'Zarr dir' }).fill(zarrDir);
	const saveBtn = page.getByRole('button', { name: 'Save' });
	await saveBtn.click();
	await waitModalClosed(page);

	const datasetRows = await page.getByRole('table').first().getByRole('row').all();

	let datasetPageLink = '';
	for (const row of datasetRows) {
		const firstCellContent = await row.getByRole('cell').first().innerText();
		if (randomDatasetName === firstCellContent.trim()) {
			datasetPageLink = /**@type {string}*/ (await row.getByRole('link').getAttribute('href'));
			break;
		}
	}

	expect(datasetPageLink).not.toEqual('');

	const match = datasetPageLink.match(/v2\/projects\/\d+\/datasets\/(\d+)/);
	if (match === null) {
		throw new Error('Unable to extract dataset id');
	}
	const datasetId = match[1];
	return { name: randomDatasetName, id: Number(datasetId), zarrDir };
}
