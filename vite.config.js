import { sveltekit } from '@sveltejs/kit/vite';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';

const packageJsonFile = fileURLToPath(new URL('package.json', import.meta.url));
const packageJsonData = readFileSync(packageJsonFile);
const pkg = JSON.parse(packageJsonData.toString());

//const enableCoverage = process.env['ENABLE_COVERAGE'];

/** @type {import('vite').UserConfig} */
const config = {
	plugins: [
		sveltekit()
	],
	define: {
		__APP_VERSION__: JSON.stringify(pkg.version)
	},
	build: {
		sourcemap: true
	},
	test: {
		globals: true,
		environment: 'jsdom',
		include: ['**/__tests__/**/*\\.test\\.js'],
		coverage: {
			provider: 'v8',
			reporter: ['text', 'json', 'html'],
			reportsDirectory: './coverage-unit'
		},
		alias: [
			// See https://github.com/vitest-dev/vitest/issues/2834#issuecomment-1439576110
			{ find: /^svelte$/, replacement: 'svelte/internal' }
		]
	},
	optimizeDeps: {
		// The dependencies to be optimized are explicitly listed, to avoid the reloads triggered by their automatic detection
		include: [
			'slim-select',
			'marked',
			'dompurify',
			'ajv',
			'@vincjo/datatables',
			'semver/functions/coerce',
			'semver/functions/gte',
			'semver/functions/lte',
			'semver/functions/valid'
		]
	}
};

export default config;
