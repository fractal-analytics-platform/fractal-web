import { test as setup } from '@playwright/test';
import { waitPageLoading } from '../utils.js';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

setup('Create fake task', async ({ page }) => {
	await page.goto('/v2/tasks/management');
	await waitPageLoading(page);

	const fakeTasks = await page.getByText('Fake Task').all();
	if (fakeTasks.length > 0) {
		console.warn('WARNING: Fake Task already exists. Skipping Fake Task creation');
		return;
	}

	await page.getByText('Single task').click();

	const command = path.join(__dirname, '..', 'data', 'fake-task.sh');

	await page.getByText('Single task').click();
	await page.getByRole('textbox', { name: 'Task name' }).fill('Fake Task');
	await page.getByRole('textbox', { name: 'Command non parallel' }).fill(command);

	await page.getByRole('button', { name: /^Create$/ }).click();
	await page.getByText('Task created successfully').waitFor();
});
