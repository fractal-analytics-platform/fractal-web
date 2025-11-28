/** @type {import('@playwright/test').PlaywrightTestConfig} */

import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.development' });

const commonTests = [
	{ name: 'auth', testMatch: /auth\.setup\.js/ },
	{
		name: 'chromium',
		testMatch: /.*\.spec\.js/,
		testIgnore: /v2\/.*\.spec\.js/,
		use: {
			...devices['Desktop Chrome'],
			storageState: 'tests/.auth/user.json',
			contextOptions: {
				permissions: ['clipboard-read', 'clipboard-write']
			}
		},
		dependencies: ['auth']
	},
	{
		name: 'firefox',
		testMatch: /.*\.spec\.js/,
		testIgnore: /v2\/.*\.spec\.js/,
		use: {
			...devices['Desktop Firefox'],
			storageState: 'tests/.auth/user.json'
		},
		dependencies: ['auth']
	}
];

const v2Tests = [
	{
		name: 'collect_mock_tasks',
		testMatch: /v2\/collect_mock_tasks\.setup\.js/,
		use: {
			storageState: 'tests/.auth/user.json'
		},
		dependencies: ['auth']
	},
	{
		name: 'create_fake_task',
		testMatch: /v2\/create_fake_task\.setup\.js/,
		use: {
			storageState: 'tests/.auth/user.json'
		},
		dependencies: ['auth']
	},
	{
		name: 'pixi',
		testMatch: /v2\/pixi\.setup\.js/,
		use: {
			storageState: 'tests/.auth/user.json'
		},
		dependencies: ['auth']
	},
	{
		name: 'chromium',
		testMatch: /v2\/.*\.spec\.js/,
		use: {
			...devices['Desktop Chrome'],
			storageState: 'tests/.auth/user.json',
			contextOptions: {
				permissions: ['clipboard-read', 'clipboard-write']
			}
		},
		dependencies: ['collect_mock_tasks', 'create_fake_task']
	},
	{
		name: 'firefox',
		testMatch: /v2\/.*\.spec\.js/,
		use: {
			...devices['Desktop Firefox'],
			storageState: 'tests/.auth/user.json'
		},
		dependencies: ['collect_mock_tasks', 'create_fake_task']
	}
];

export default defineConfig({
	testDir: 'tests',
	retries: 3,

	projects: [...commonTests, ...v2Tests],

	webServer: [
		{
			command: './tests/start-test-server.sh --branch 3024-move-from-project_dir-to-project_dirs',
			port: 8000,
			waitForPort: true,
			stdout: 'pipe',
			reuseExistingServer: !process.env.CI,
			timeout: 120000
		},
		{
			command: 'node ./tests/fake-job-server.js',
			port: 8080,
			waitForPort: true,
			stdout: 'pipe',
			reuseExistingServer: !process.env.CI
		},
		{
			command:
				'npm run build && LOG_LEVEL_CONSOLE=debug ORIGIN=http://localhost:5173 PORT=5173 FRACTAL_RUNNER_BACKEND=local node build',
			port: 5173,
			stdout: 'pipe',
			reuseExistingServer: !process.env.CI
		}
	],
	use: {
		baseURL: 'http://localhost:5173',
		screenshot: 'only-on-failure'
	}
});
