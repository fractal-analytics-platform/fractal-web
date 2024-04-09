import { waitPageLoading } from '../utils.js';
import { expect, test } from './workflow_fixture.js';

test('Workflow task meta', async ({ page, workflow }) => {
	await page.waitForURL(workflow.url);
	await waitPageLoading(page);

	await test.step('Add 2 tasks to workflow', async () => {
		await workflow.addFakeTask();
		await workflow.addFakeTask();
	});

	await test.step('Select first task meta', async () => {
		await page.getByText('Fake Task').first().click();
		await page.getByText('Meta', { exact: true }).click();
	});

	await test.step('Add meta property to first task', async () => {
		await page.getByRole('button', { name: 'Add property' }).click();
		await page.getByRole('textbox').nth(0).fill('key1');
		await page.getByRole('textbox').nth(1).fill('value1');
		await page.getByLabel('Save argument').click();
		await page.waitForFunction(
			() => document.querySelectorAll('#meta-tab input[type="text"]').length === 0
		);
	});

	await test.step('Select second task and then go back to first task', async () => {
		await page.getByText('Fake Task').nth(1).click();
		await page.getByText('Fake Task').nth(0).click();
	});

	await test.step('Verify that the inserted values are still there', async () => {
		await expect(page.getByText('key1')).toBeVisible();
		await expect(page.getByText('value1')).toBeVisible();
	});

	await test.step('Verify that the inserted values have been saved', async () => {
		await page.reload();
		await waitPageLoading(page);
		await page.getByText('Fake Task').first().click();
		await page.getByText('Meta', { exact: true }).click();
		await expect(page.getByText('key1')).toBeVisible();
		await expect(page.getByText('value1')).toBeVisible();
	});
});
