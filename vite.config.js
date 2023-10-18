import { sveltekit } from '@sveltejs/kit/vite';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import istanbul from 'vite-plugin-istanbul';

const packageJsonFile = fileURLToPath(new URL('package.json', import.meta.url));
const packageJsonData = readFileSync(packageJsonFile);
const pkg = JSON.parse(packageJsonData);

/** @type {import('vite').UserConfig} */
const config = {
	plugins: [
		sveltekit(),
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
	test: {
		globals: true,
		include: ['**/__tests__/**/*.?(c|m)[jt]s?(x)'],
		coverage: {
			provider: 'istanbul',
			reporter: ['text', 'json', 'html'],
			reportsDirectory: './coverage-unit',
		}
	},
	optimizeDeps: {
		// The dependencies to be optimized are explicitly listed, to avoid the reloads triggered by their automatic detection
		include: ['slim-select', 'marked', 'dompurify', 'semver', 'ajv', '@vincjo/datatables']
	}
};

export default config;
