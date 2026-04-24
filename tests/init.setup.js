import { test as setup, expect } from '@playwright/test';
import { checkApiError, getFractalCookie, login, waitPageLoading } from './utils/utils.js';
import path from 'path';
import os from 'os';
import fs from 'fs';
import { createFakeTask } from './utils/v2/task.js';

const authFile = 'tests/.auth/user.json';

/**
 * These credentials have to match with the environment variables
 * PUBLIC_GUEST_USERNAME and PUBLIC_GUEST_PASSWORD defined in CI configuration.
 */
const GUEST_USERNAME = 'guest@fractal.xy';
const GUEST_PASSWORD = 'guest';

setup('init', async ({ page }) => {
	setup.slow();

	// Login as admin
	await login(page, 'admin@fractal.xy', '1234');
	await page.context().storageState({ path: authFile });

	await Promise.all([
		collectMockTasks(page),
		createDefaultFakeTask(page),
		createDefaultGuestUser(page)
	]);
});

const tasksMockWheelUrl =
	'https://github.com/fractal-analytics-platform/fractal-server/raw/main/tests/v2/fractal_tasks_mock/dist/fractal_tasks_mock-0.0.1-py3-none-any.whl';

/**
 * @param {import('@playwright/test').Page} page
 */
async function collectMockTasks(page) {
	if (await checkForTaskGroup(page, 'fractal-tasks-mock')) {
		console.warn('WARNING: Mock tasks V2 already collected. Skipping tasks collection');
		return;
	}
	const file = await downloadWheel(page);
	await startTasksCollection(page, file);
	let status = 'pending';
	while (status !== 'OK') {
		status = await checkCollectionStatus(page);
		await new Promise((r) => setTimeout(r, 500));
	}
}

/**
 * @param {import('@playwright/test').Page} page
 */
async function createDefaultFakeTask(page) {
	if (await checkForTaskGroup(page, 'Fake Task')) {
		console.warn('WARNING: Fake Task already exists. Skipping Fake Task creation');
		return;
	}
	await createFakeTask(page, { name: 'Fake Task', type: 'non_parallel' });
}

/**
 * @param {import('@playwright/test').Page} page
 * @param {string} name
 */
async function checkForTaskGroup(page, name) {
	const response = await page.request.get(`/api/v2/task-group/?slim=true&only_active=true`, {
		headers: { Cookie: await getFractalCookie(page) }
	});
	await checkApiError(response, 'Unable to retrieve task-groups');
	const taskGroups = await response.json();
	const mockTasks = taskGroups.find(([n]) => n === name);
	return !!mockTasks;
}

/**
 * @param {import('@playwright/test').Page} page
 */
async function downloadWheel(page) {
	console.log('Downloading fractal_tasks_mock...');
	const response = await page.request.get(tasksMockWheelUrl);
	await checkApiError(response, 'Unable to download fractal_tasks_mock wheel file');
	const body = await response.body();
	const tasksMockWheelFolder = path.resolve(os.tmpdir(), 'playwright');
	if (!fs.existsSync(tasksMockWheelFolder)) {
		fs.mkdirSync(tasksMockWheelFolder);
	}
	const file = path.resolve(tasksMockWheelFolder, 'fractal_tasks_mock-0.0.1-py3-none-any.whl');
	fs.writeFileSync(file, body);
	return file;
}

/**
 * @param {import('@playwright/test').Page} page
 * @param {string} file
 */
async function startTasksCollection(page, file) {
	console.log('Collecting fractal_tasks_mock...');
	await page.goto('/v2/tasks/management');
	await waitPageLoading(page);

	await page.getByText('Local whl', { exact: true }).click();

	const fileChooserPromise = page.waitForEvent('filechooser');
	await page.getByText('Upload a wheel file', { exact: true }).click();
	const fileChooser = await fileChooserPromise;
	await fileChooser.setFiles(file);

	await page.getByRole('button', { name: 'Collect', exact: true }).click();

	// Wait for Task activities table
	await page.waitForFunction(
		(expectedCount) => document.querySelectorAll('table').length === expectedCount,
		2
	);
	await expect(page.getByRole('row', { name: /pending|ongoing/ })).toBeVisible();
}

/**
 * @param {import('@playwright/test').Page} page
 */
async function checkCollectionStatus(page) {
	const response = await page.request.get(`/api/v2/task-group/activity`, {
		headers: { Cookie: await getFractalCookie(page) }
	});
	await checkApiError(response, 'Unable to retrieve task-group activities');
	const activities = await response.json();
	const activity = activities.find((a) => a.pkg_name === 'fractal-tasks-mock');
	if (!activity) {
		throw new Error('No activity found for fractal-tasks-mock');
	}
	if (['pending', 'ongoing', 'OK'].includes(activity.status)) {
		return activity.status;
	}
	throw new Error(`Unexpected status ${activity.status} for fractal-tasks-mock collection`);
}

/**
 * @param {import('@playwright/test').Page} page
 */
async function createDefaultGuestUser(page) {
	if (await checkUserExists(page, GUEST_USERNAME)) {
		console.warn('WARNING: Default guest user already created. Skipping guest user creation');
		return;
	}
	const response1 = await page.request.post(`/api/auth/register`, {
		headers: { Cookie: await getFractalCookie(page) },
		data: { email: GUEST_USERNAME, password: GUEST_PASSWORD, profile_id: 1, project_dirs: ['/tmp'] }
	});
	await checkApiError(response1, 'Unable to create guest user');
	const user = await response1.json();
	const response2 = await page.request.patch(`/api/auth/users/${user.id}`, {
		headers: { Cookie: await getFractalCookie(page) },
		data: { is_verified: true, is_guest: true }
	});
	await checkApiError(response2, 'Unable to patch guest user');
	return user;
}

/**
 * @param {import('@playwright/test').Page} page
 * @param {string} email
 */
async function checkUserExists(page, email) {
	const response = await page.request.get(`/api/auth/users`, {
		headers: { Cookie: await getFractalCookie(page) }
	});
	await checkApiError(response, 'Unable to retrieve users');
	const users = await response.json();
	const user = users.find((u) => u.email === email);
	return !!user;
}
