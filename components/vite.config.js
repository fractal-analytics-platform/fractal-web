import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';

/** @type {import('vite').UserConfigExport} */
const config = defineConfig({
	plugins: [svelte()],
	build: {
		outDir: './build',
		emptyOutDir: true,
		lib: {
			name: 'fractal-components',
			entry: './src/lib/index.js'
		}
	},
	test: {
		globals: true,
		environment: 'jsdom',
		include: ['**/__tests__/**/*\\.test\\.js'],
		alias: [
			// See https://github.com/vitest-dev/vitest/issues/2834#issuecomment-1439576110
			{ find: /^svelte$/, replacement: 'svelte/internal' }
		],
		setupFiles: ['vitest.setup.js']
	}
});

export default config;
