import { test } from '@playwright/test';
import { createProject, login, waitPageLoading } from '../utils.js';
import { createTestUser } from './user_utils.js';
import { createDataset } from './dataset_utils.js';

// Reset storage state for this file to avoid being authenticated
test.use({ storageState: { cookies: [], origins: [] } });

test('Admin page for projects', async ({ page }) => {
	// TODO: create Profile2 for Resource1
	// TODO: create Resource2
	// TODO: create Profile3 for Resource2

	const adminEmail = 'admin@fractal.xy';
	await login(page, adminEmail, '1234');
	await waitPageLoading(page);

	const project = await createProject(page);
	const dataset = await createDataset(page, project.id);

	const userEmail1 = await createTestUser(page);
	const userEmail2 = await createTestUser(page);
	// TODO: assign Profile2 to User2
	const userEmail3 = await createTestUser(page);
	// TODO: assign Profile3 to User3
	const userEmail4 = await createTestUser(page, '/xxx');

	// TODO: find `project` in the admin-project page
	// TODO: pass ownership to User1 -> OK
	// TODO: pass ownership to User2 -> See profile warning -> OK
	// TODO: pass ownership to User3 -> See profile warning -> FAIL for different resources
	// TODO: pass ownership to User4 -> FAIL for project dirs

	console.log(dataset, userEmail1, userEmail2, userEmail3, userEmail4);
});
