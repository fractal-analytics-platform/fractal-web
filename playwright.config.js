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
		}
	],

	webServer: {
		command: 'npm run build && npm run preview',
		port: 4173
	}
});