import { sveltekit } from '@sveltejs/kit/vite';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { defineConfig } from 'vitest/config';

const packageJsonFile = fileURLToPath(new URL('package.json', import.meta.url));
const packageJsonData = readFileSync(packageJsonFile);
const pkg = JSON.parse(packageJsonData.toString());

/** @type {import('vite').UserConfigExport} */
const config = defineConfig({
	plugins: [
		sveltekit(),
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
		exclude: ['jschema/**', 'node_modules', 'build', '.idea', '.git', '.cache'],
		coverage: {
			provider: 'istanbul',
			reporter: ['text', 'json', 'html'],
			reportsDirectory: './coverage-unit',
			include: ['src'],
			all: true
		},
		alias: [
			// See https://github.com/vitest-dev/vitest/issues/2834#issuecomment-1439576110
			{ find: /^svelte$/, replacement: 'svelte/internal' }
		]
	},
	resolve: {
		alias: {
			'fractal-jschema': fileURLToPath(new URL('./jschema/src/lib/index.js', import.meta.url))
		}
	},
	// Tells Vite to allow serving files from the jschema folder when running npm run dev
	server: {
		fs: {
			allow: ['./jschema/src/lib']
		}
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
});

export default config;
