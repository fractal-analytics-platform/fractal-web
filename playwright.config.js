/** @type {import('@playwright/test').PlaywrightTestConfig} */

import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.development' });

export default defineConfig({
	testDir: 'tests',
	retries: 3,

	projects: [
		{ name: 'auth', testMatch: /auth\.setup\.js/ },
		{
			name: 'collect_core_tasks',
			testMatch: /v1\/collect_core_tasks\.setup\.js/,
			use: {
				storageState: 'tests/.auth/user.json'
			},
			dependencies: ['auth']
		},
		{
			name: 'create_fake_task',
			testMatch: /v1\/create_fake_task\.setup\.js/,
			use: {
				storageState: 'tests/.auth/user.json'
			},
			dependencies: ['collect_core_tasks', 'auth']
		},
		{
			name: 'chromium',
			use: {
				...devices['Desktop Chrome'],
				storageState: 'tests/.auth/user.json'
			},
			dependencies: ['create_fake_task']
		},
		{
			name: 'firefox',
			use: {
				...devices['Desktop Firefox'],
				storageState: 'tests/.auth/user.json'
			},
			dependencies: ['create_fake_task']
		}
	],

	webServer: [
		{
			command: './tests/start-test-server.sh 2.0.0a2',
			port: 8000,
			waitForPort: true,
			stdout: 'pipe',
			reuseExistingServer: !process.env.CI
		},
		{
			command: 'node ./tests/fake-job-server.js',
			port: 8080,
			waitForPort: true,
			stdout: 'pipe',
			reuseExistingServer: !process.env.CI
		},
		{
			command: 'npm run build && ORIGIN=http://localhost:5173 PORT=5173 node build',
			port: 5173,
			stdout: 'pipe',
			reuseExistingServer: !process.env.CI
		}
	],
	use: {
		baseURL: 'http://localhost:5173'
	}
});
