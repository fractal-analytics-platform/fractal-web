/** @type {import('@playwright/test').PlaywrightTestConfig} */

import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.development' });

const v1Tests = [
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
		testMatch: /v1\/.*\.spec\.js/,
		use: {
			...devices['Desktop Chrome'],
			storageState: 'tests/.auth/user.json'
		},
		dependencies: ['create_fake_task']
	},
	{
		name: 'firefox',
		testMatch: /v1\/.*\.spec\.js/,
		use: {
			...devices['Desktop Firefox'],
			storageState: 'tests/.auth/user.json'
		},
		dependencies: ['create_fake_task']
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
		name: 'chromium',
		testMatch: /v2\/.*\.spec\.js/,
		use: {
			...devices['Desktop Chrome'],
			storageState: 'tests/.auth/user.json'
		},
		dependencies: ['collect_mock_tasks']
	},
	{
		name: 'firefox',
		testMatch: /v2\/.*\.spec\.js/,
		use: {
			...devices['Desktop Firefox'],
			storageState: 'tests/.auth/user.json'
		},
		dependencies: ['collect_mock_tasks']
	}
];

const commonTests = [
	{ name: 'auth', testMatch: /auth\.setup\.js/ },
	{
		name: 'chromium',
		testMatch: /.*\.spec\.js/,
		testIgnore: /(v1|v2)\/.*\.spec\.js/,
		use: {
			...devices['Desktop Chrome'],
			storageState: 'tests/.auth/user.json'
		},
		dependencies: ['auth']
	},
	{
		name: 'firefox',
		testMatch: /.*\.spec\.js/,
		testIgnore: /(v1|v2)\/.*\.spec\.js/,
		use: {
			...devices['Desktop Firefox'],
			storageState: 'tests/.auth/user.json'
		},
		dependencies: ['auth']
	}
]

const version = process.env.TEST_VERSION || 'v2';

const tests = version === 'v2' ? v2Tests : v1Tests;

export default defineConfig({
	testDir: 'tests',
	retries: 3,

	projects: [...commonTests, ...tests],

	webServer: [
		{
			command: './tests/start-test-server.sh 2.4.0a2',
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
				'npm run build && LOG_LEVEL_CONSOLE=debug ORIGIN=http://localhost:5173 PORT=5173 node build',
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
