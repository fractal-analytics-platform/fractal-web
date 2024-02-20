import { test as setup } from '@playwright/test';
import { waitPageLoading } from './utils.js';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

setup('Create fake task', async ({ page }) => {
	await page.goto('/tasks');
	await waitPageLoading(page);

	const fakeTasks = await page.getByText('Fake Task').all();
	if (fakeTasks.length > 0) {
		console.warn('WARNING: Fake Task already exists. Skipping Fake Task creation');
		return;
	}

	await page.getByText('Single task').click();

	const command = path.join(__dirname, 'data', 'fake-task.sh');

	await page.getByRole('textbox', { name: 'Task name' }).fill('Fake Task');
	await page.getByRole('textbox', { name: 'Command' }).fill(command);
	await page.getByRole('textbox', { name: 'Source' }).fill(`fake-task-source`);
	await page.getByRole('textbox', { name: 'Input Type' }).fill('Any');
	await page.getByRole('textbox', { name: 'Output Type' }).fill('Any');

	await page.getByRole('button', { name: /^Create$/ }).click();
	await page.getByText('Task created successfully').waitFor();
});
