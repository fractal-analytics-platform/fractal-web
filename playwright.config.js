/** @type {import('@playwright/test').PlaywrightTestConfig} */

import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
	testDir: 'tests',

	projects: [
		{ name: 'setup', testMatch: /.*\.setup\.js/ },

		{
			name: 'chromium',
			use: {
				...devices['Desktop Chrome'],
				storageState: 'tests/.auth/user.json'
			},
			dependencies: ['setup']
		},
		{
			name: 'firefox',
			use: {
				...devices['Desktop Firefox'],
				storageState: 'tests/.auth/user.json'
			},
			dependencies: ['setup']
		}
	],

	webServer: [
		{
			command: './tests/start-test-server.sh 1.3.12a0',
			port: 8000,
			waitForPort: true,
			stdout: 'pipe',
			reuseExistingServer: !process.env.CI,
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
