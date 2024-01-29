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
			testMatch: /collect_core_tasks\.setup\.js/,
			use: {
				storageState: 'tests/.auth/user.json'
			},
			dependencies: ['auth']
		},
		{
			name: 'chromium',
			use: {
				...devices['Desktop Chrome'],
				storageState: 'tests/.auth/user.json'
			},
			dependencies: ['collect_core_tasks']
		},
		{
			name: 'firefox',
			use: {
				...devices['Desktop Firefox'],
				storageState: 'tests/.auth/user.json'
			},
			dependencies: ['collect_core_tasks']
		}
	],

	webServer: [
		{
			command: './tests/start-test-server.sh 1.4.3a2',
			port: 8000,
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
