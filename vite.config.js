import { sveltekit } from '@sveltejs/kit/vite';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import istanbul from 'vite-plugin-istanbul';

const packageJsonFile = fileURLToPath(new URL('package.json', import.meta.url));
const packageJsonData = readFileSync(packageJsonFile);
const pkg = JSON.parse(packageJsonData);

const enableIstanbul = process.env['ENABLE_COVERAGE'];

/** @type {import('vite').UserConfig} */
const config = {
	plugins: [
		sveltekit(),
		enableIstanbul &&
			istanbul({
				include: 'src/*',
				exclude: ['node_modules', 'tests', 'static'],
				extension: ['.js', '.svelte'],
				requireEnv: false,
				forceBuildInstrument: true
			})
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
			provider: 'istanbul',
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
		include: ['slim-select', 'marked', 'dompurify', 'semver', 'ajv', '@vincjo/datatables']
	}
};

export default config;
